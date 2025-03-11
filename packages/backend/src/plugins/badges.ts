import crypto from 'crypto';
import axios from 'axios';
import {
  createRouter,
  BadgeContext,
  BadgeFactories,
  Badge,
} from '@backstage-community/plugin-badges-backend';
import { TokenManager } from '@backstage/backend-common';

import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
  ZFCatalogService
} from '@internal/plugin-zf-tech-insights-backend';
import { ComponentEntityV1alpha1, Entity, RELATION_OWNED_BY, stringifyEntityRef, } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';
import { S3Service } from '@internal/plugin-zf-tech-insights-backend';
import { S3API } from 'backstage-plugin-zf-tech-insights-common';

type BadgeType = 'service_owner' | 'docs' | 'catalog' | 'code_coverage';

interface CoverageResponse {
  entity: {
    name: string;
    kind: string;
    namespace: string;
  };
  history: Array<{
    timestamp: number;
    branch: {
      available: number;
      covered: number;
      missed: number;
      percentage: number;
    };
    line: {
      available: number;
      covered: number;
      missed: number;
      percentage: number;
    };
  }>;
}

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

function entityCoverageUrl(context: BadgeContext): string {
  const e = context.entity!;
  const entityUri = `${e.metadata.namespace || 'default'}/${e.kind}/${e.metadata.name}`;
  const apiBaseUrl = `${context.config.getString('app.baseUrl')}/catalog`;
  return `${apiBaseUrl}/${entityUri}/code-coverage`.toLowerCase();
}


class BadgeConstructor {
  private readonly env: PluginEnvironment;
  private readonly tokenManager: TokenManager;
  private ownersCache = new Map<string, string[]>();
  private coverageCache = new Map<string, string>();
  private s3Api: S3API;

  constructor(env: PluginEnvironment) {
    this.env = env
    this.tokenManager = env.tokenManager
    this.s3Api = new S3Service(env.config, { region: env.config.getString('badges.bucket_region') });
  }

  /**
   * Get the owners for an entity.
   */
  async getOwnersForEntity(entity: Entity, catalogClient: CatalogClient): Promise<string[]> {
    const noownerEntityRef = stringifyEntityRef({
      kind: 'group',
      namespace: 'default',
      name: 'noowner',
    });
    const ownedByRelations = entity.relations?.filter(relation => relation.type === RELATION_OWNED_BY && relation.targetRef !== noownerEntityRef);
    if (!ownedByRelations) {
      return [];
    }
    const ownerEntities = await Promise.all(ownedByRelations
      .map((relation: any) => relation.targetRef ? catalogClient.getEntityByRef(relation.targetRef) : Promise.resolve()));
    return ownerEntities.filter(owner => owner).map(e => (e as any)?.spec?.profile?.displayName ?? e?.metadata.name ?? '');
  }

   /**
   * Get the code coverage for an entity.
   */
   async getCoverageForEntity(entity: Entity, token: string): Promise<string> {
    const scheduleLogger = this.env.logger.child({ name: 'Badge catalog creator' });
    const noCoverageEntityRef = "0%";
    const entityUri = `entity=${entity.kind}:${entity.metadata.namespace || 'default'}/${entity.metadata.name}`;
    const apiBaseUrl = `${this.env.config.getString('backend.baseUrl')}/api`;
    const coverageUrl = `${apiBaseUrl}/code-coverage/history?${entityUri}&limit=1`.toLowerCase(); // fix this

    try {
      const response = await axios.get<CoverageResponse>(coverageUrl, {
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }});
      scheduleLogger.info(`Retrieved code coverage for entity ${entity.metadata.name} -- coverage: ${response.data.history[0].line.percentage.toFixed(2)}`);
      return response.data.history[0].line.percentage.toFixed(2);
    } catch (error: any) {
      scheduleLogger.error(`Failed to retrieve code coverage for entity ${entity.metadata.name} -- error:  ${error.message}`);
      return noCoverageEntityRef;
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
      region: this.env.config.getString('badges.bucket_region'),
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
      for (const badgeType of ['service_owner', 'docs', 'catalog', 'code_coverage'] as BadgeType[]) {
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

    const token = await this.tokenManager.getToken();
    const catalog = new CatalogClient({ discoveryApi: this.env.discovery });
    const entities = await this.getStandAloneEntities(catalog);
    scheduleLogger.debug(`Building cache for entities: ${entities.map(e => e.metadata.name).join(', ')}`);

    for (const entity of entities) {
      // Given the badge factory does not support async operations, we need to cache the owners
      // and retrieve them later when the badge is created.
      const owners = await this.getOwnersForEntity(entity, catalog);
      const coverage = await this.getCoverageForEntity(entity, token.token);
      this.ownersCache.set(stringifyEntityRef(entity), owners);
      this.coverageCache.set(stringifyEntityRef(entity), coverage);

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
      initialDelay: { minutes: 5 },
      timeout: { hours: 1 },
      fn: this.constructBadges.bind(this),
    });
  };

  /**
   * Configure the task that will update the cache
   */
  async configureCacheUpdate() {
    this.env.scheduler.scheduleTask({
      id: 'update-cache',
      frequency: { minutes: 3 },
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
      code_coverage: {
        createBadge: (ctx: BadgeContext): Badge => {
          let coverage = '0%';
          if (ctx.entity) {
            const coverageValue = this.coverageCache.get(stringifyEntityRef(ctx.entity));
            if (coverageValue) {
              coverage = coverageValue;
            }
          }
          return {
            label: 'coverage',
            message: coverage,
            link: entityCoverageUrl(ctx),
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