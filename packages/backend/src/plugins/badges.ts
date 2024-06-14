import crypto from 'crypto';
import {
  createRouter,
  BadgeContext,
  BadgeFactories,
  Badge,
} from '@backstage-community/plugin-badges-backend';

import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
  ZFCatalogService
} from '@internal/plugin-zf-tech-insights-backend';
import { ComponentEntityV1alpha1, Entity, RELATION_OWNED_BY, stringifyEntityRef, } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';
import { S3Service } from '@internal/plugin-zf-tech-insights-backend';
import { S3API } from 'backstage-plugin-zf-tech-insights-common';

type BadgeType = 'service_owner' | 'docs' | 'catalog';

function entityUrl(context: BadgeContext): string {
  const e = context.entity!;
  const entityUri = `${e.metadata.namespace || 'default'}/${e.kind}/${e.metadata.name}`;
  const catalogUrl = `${context.config.getString('app.baseUrl')}/catalog`;
  return `${catalogUrl}/${entityUri}`.toLowerCase();
}

function entityDocsUrl(context: BadgeContext): string {
  const e = context.entity!;
  const entityUri = `${e.metadata.namespace || 'default'}/${e.kind}/${e.metadata.name}`;
  return `docs/${entityUri}`.toLowerCase();
}

class BadgeConstructor {
  private readonly env: PluginEnvironment;
  private ownersCache = new Map<string, string[]>();
  private s3Api: S3API;

  constructor(env: PluginEnvironment) {
    this.env = env
    this.s3Api = new S3Service(env.config);
  }

  /**
   * Get the owners for an entity.
   */
  async getOwnersForEntity(entity: Entity, catalogClient: CatalogClient): Promise<string[]> {
    const ownedByRelations = entity.relations?.filter(relation => relation.type === RELATION_OWNED_BY);
    if (!ownedByRelations) {
      return [];
    } else {
      const ownerEntities = await Promise.all(ownedByRelations
        .map((relation: any) => relation.targetRef ? catalogClient.getEntityByRef(relation.targetRef) : Promise.resolve()));
      return ownerEntities.filter(owner => owner).map(e => (e as any)?.spec?.profile?.displayName ?? e?.metadata.name ?? '');
    }
  }

  /**
   * Get the standalone entities.
   */
  async getStandAloneEntities(catalogClient: CatalogClient): Promise<ComponentEntityV1alpha1[]> {
    const zfCatalogApi = new ZFCatalogService(
      catalogClient,
      this.env.tokenManager,
    );
    return await zfCatalogApi.getStandaloneEntities();
  }

  /**
   * Get the badge for the entity.
   * @param entity The entity
   * @param badge The badge
   * @returns 
   */
  async getBadge(entity: Entity, badge: BadgeType): Promise<string> {
    const baseUrl = await this.env.discovery.getBaseUrl('badges');
    const url = `${baseUrl}/entity/${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name}/badge/${badge}`;
    let response: Response | null = null;
    let responseText: string | null = null;
    try {
      response = await fetch(url);
      if (response.status !== 200) {
        throw new Error(`Failed to create owner ${badge} for entity ${entity.metadata.name}: with status code ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to create owner ${badge} for entity ${entity.metadata.name}: ${error} - ${responseText}`);
    }
  }

  /**
   * Store the badge for the entity.
   * @param entity The entity
   * @param badgeContent The badge content
   * @param badgeType The badge type
   */
  async storeBadge(entity: Entity, badgeContent: string, badgeType: BadgeType) {
    const shasum = crypto.createHash('sha1').update(stringifyEntityRef(entity))
    await this.s3Api.saveObject({
      bucket: this.env.config.getString('badges.bucket'),
      key: `repo-badges/${shasum.digest('hex')}/${badgeType}.svg`,
      body: badgeContent,
      contentType: 'image/svg+xml',
    });
  }

  /**
   * Construct the badge for the entity.
   * @param entity The entity
   * @param badgeType The badge type
   */
  async constructBadge(entity: Entity, badgeType: BadgeType) {
    let ownerBadgeContent: string;
    try {
      ownerBadgeContent = await this.getBadge(entity, badgeType);
    }
    catch (err) {
      throw new Error(`Failed to create owner badge for entity ${entity.metadata.name}: ${err}`);
    }

    try {
      await this.storeBadge(entity, ownerBadgeContent, badgeType);
    }
    catch (err) {
      throw new Error(`Failed to store owner badge for entity ${entity.metadata.name}: ${err}`);
    }
  }

  /**
   * Construct the badges for the entities.
   */
  async constructBadges() {
    const scheduleLogger = this.env.logger.child({ name: 'Badge catalog creator' });

    scheduleLogger.debug("Starting badge construction");

    const catalog = new CatalogClient({ discoveryApi: this.env.discovery });
    const entities = await this.getStandAloneEntities(catalog);
    scheduleLogger.debug(`Building badges for entities: ${entities.map(e => e.metadata.name).join(', ')}`);

    for (const entity of entities) {
      for (const badgeType of ['service_owner', 'docs', 'catalog'] as BadgeType[]) {
        try {
          await this.constructBadge(entity, badgeType);
          scheduleLogger.debug(`Created badge for entity ${entity.metadata.name} and type ${badgeType}`);
        }
        catch (err) {
          scheduleLogger.error(`Failed to create badge for entity ${entity.metadata.name} and type ${badgeType}: ${err}`);
        }
      }
    }
    scheduleLogger.info(`Badges construction completed`);
  }

  /**
   * Update cache used by badge builder
   */
  async updateCache() {
    const scheduleLogger = this.env.logger.child({ name: 'Badge catalog creator' });

    scheduleLogger.debug("Starting cache update");

    const catalog = new CatalogClient({ discoveryApi: this.env.discovery });
    const entities = await this.getStandAloneEntities(catalog);
    scheduleLogger.debug(`Building cache for entities: ${entities.map(e => e.metadata.name).join(', ')}`);

    for (const entity of entities) {
      // Given the badge factory does not support async operations, we need to cache the owners
      // and retrieve them later when the badge is created.
      const owners = await this.getOwnersForEntity(entity, catalog);
      this.ownersCache.set(stringifyEntityRef(entity), owners);

      scheduleLogger.debug(`Cached ${owners.join(', ')} as owners for entity ${entity.metadata.name}`);
    }
    scheduleLogger.info(`Cache update completed`);
  }

  /**
   * Configure the task that will create the badges
   */
  async configureBadgesCreation() {
    this.env.scheduler.scheduleTask({
      id: 'create-catalog-badges',
      frequency: { hours: 12 },
      initialDelay: { hours: 1 },
      timeout: { hours: 1 },
      fn: this.constructBadges.bind(this),
    });
  };

  /**
   * Configure the task that will update the cache
   */
  async configureCacheUpdate() {
    this.env.scheduler.scheduleTask({
      id: 'create-catalog-badges',
      frequency: { minutes: 30 },
      initialDelay: { seconds: 0 },
      timeout: { minutes: 10 },
      fn: this.updateCache.bind(this),
    });
  };

  createBadgeFactories(): BadgeFactories {
    return {
      service_owner: {
        createBadge: (ctx: BadgeContext): Badge => {
          const link = entityUrl(ctx);
          const owners = ctx.entity ? this.ownersCache.get(stringifyEntityRef(ctx.entity)) : [];
          let message = 'No owners'
          if (owners && owners.filter(owner => owner).length) {
            message = owners.join(', ');
          }
          return {
            label: 'owners',
            message,
            link,
          };
        },
      },
      catalog: {
        createBadge: (ctx: BadgeContext): Badge => {
          return {
            label: 'catalog',
            message: (ctx.entity as any)?.spec?.profile?.displayName ?? ctx.entity?.metadata.name ?? '',
            link: entityUrl(ctx),
          };
        },
      },
      docs: {
        createBadge: (ctx: BadgeContext): Badge => {
          return {
            label: 'docs',
            message: (ctx.entity as any)?.spec?.profile?.displayName ?? ctx.entity?.metadata.name ?? '',
            link: entityDocsUrl(ctx),
          };
        },
      },
    };
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const constructor = new BadgeConstructor(env);
  constructor.configureCacheUpdate();

  if (process.env.NOMAD_ALLOC_INDEX === '0' || !process.env.env || process.env.env == 'local') {
    constructor.configureBadgesCreation();
  }

  return await createRouter({
    config: env.config,
    discovery: env.discovery,
    badgeFactories: constructor.createBadgeFactories(),
    tokenManager: env.tokenManager,
    logger: env.logger,
    identity: env.identity,
  });
}