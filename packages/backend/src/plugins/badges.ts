import {
  createRouter,
  createDefaultBadgeFactories,
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

function entityUrl(context: BadgeContext): string {
  const e = context.entity!;
  const entityUri = `${e.metadata.namespace || 'default'}/${e.kind}/${e.metadata.name}`;
  const catalogUrl = `${context.config.getString('app.baseUrl')}/catalog`;
  return `${catalogUrl}/${entityUri}`.toLowerCase();
}

class BadgeConstructor {
  private readonly env: PluginEnvironment;
  private ownersCache = new Map<string, string[]>();

  constructor(env: PluginEnvironment) {
    this.env = env
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
   * @returns 
   */
  async getOwnersBadge(entity: Entity): Promise<string> {
    const baseUrl = await this.env.discovery.getBaseUrl('badges');
    const url = `${baseUrl}/entity/${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name}/badge/service_owner`;
    let response: Response | null = null;
    let responseText: string | null = null;
    try {
      response = await fetch(url);
      if (response.status !== 200) {
        throw new Error(`Failed to create badge for entity ${entity.metadata.name}: with status code ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to create badge for entity ${entity.metadata.name}: ${error} - ${responseText}`);
    }
  }

  async storeBadge(entity: Entity, badgeContent: string) {
    
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
      // Given the badge factory does not support async operations, we need to cache the owners
      // and retrieve them later when the badge is created.
      const owners = this.ownersCache.get(stringifyEntityRef(entity)) ?? [];
      scheduleLogger.debug(`Creating badge for entity ${entity.metadata.name} and owners ${owners.join(', ')}`);

      let badgeContent: string;
      try {
        badgeContent = await this.getOwnersBadge(entity);
      }
      catch (err) {
        scheduleLogger.error(`Failed to create badge for entity ${entity.metadata.name}: ${err}`);
        continue;
      }

      try {
        await this.storeBadge(entity, badgeContent);
      }
      catch (err) {
        scheduleLogger.error(`Failed to store badge for entity ${entity.metadata.name}: ${err}`);
        continue;
      }
    }
    scheduleLogger.info(`Badges construction completed`);
  }

  /**
   * Update owners cache used by badge builder
   */
  async updateOwnersCache() {
    const scheduleLogger = this.env.logger.child({ name: 'Badge catalog creator' });

    scheduleLogger.debug("Starting owners cache update");

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
    scheduleLogger.info(`Owners cache update completed`);
  }

  /**
   * Configure the task that will create the badges
   */
  async configureBadgesCreation() {
    this.env.scheduler.scheduleTask({
      id: 'create-catalog-badges',
      frequency: { minutes: 1 },
      initialDelay: { seconds: 30 },
      timeout: { minutes: 30 },
      fn: this.constructBadges.bind(this),
    });
  };

  /**
   * Configure the task that will update the owner cache
   */
  async configureOwnerCacheUpdate() {
    this.env.scheduler.scheduleTask({
      id: 'create-catalog-badges',
      frequency: { minutes: 1 },
      initialDelay: { seconds: 0 },
      timeout: { minutes: 5 },
      fn: this.updateOwnersCache.bind(this),
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
      ...createDefaultBadgeFactories(),
    };
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const constructor = new BadgeConstructor(env);
  constructor.configureOwnerCacheUpdate();

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