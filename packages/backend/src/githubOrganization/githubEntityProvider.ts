
import { defaultOrganizationTeamTransformer, GithubOrgEntityProviderOptions, GithubTeam, TransformerContext } from '@backstage/plugin-catalog-backend-module-github';
import { Entity, CompoundEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { PluginEnvironment } from '../types';
import { CatalogClient } from '@backstage/catalog-client';
import { Logger } from 'winston';

/**
 * Checks if the entity is a feature team.
 * 
 * @param entity The entity to check
 * @returns True if the entity is a feature team
 */
export const isFeatureTeam = (entity: Entity): boolean => {
    const parentName = entity.spec?.parent as (string | undefined)
    return !!parentName && parentName.endsWith('-pillar')
}

/**
 * Pulls the pillar from the entity's annotations.
 * 
 * @param entityRef The entity to pull the pillar from
 * @param catalogClient The catalog client to use
 * @param logger The logger to use
 * @returns The pillar, or null if it could not be pulled
 */
export const getPillarForEntity = async (entityRef: CompoundEntityRef, catalogClient: CatalogClient, logger: Logger): Promise<string | null> => {
    const entity = await catalogClient.getEntityByRef(entityRef)
    if (!entity) {
        logger.warn(`Failed to pull pillar from ${entityRef}: Not found`)
        return null
    }

    const pillar = entity.metadata.annotations ? entity.metadata.annotations['zerofox.com/pillar'] : null
    if (!pillar) {
        logger.warn(`Failed to pull pillar from ${entityRef}: pillar not set in the annotations`)
        return null
    }

    return pillar
}

/**
 * Pulls the pillar from the parent team, if it exists.
 * 
 * @param team The team to pull the pillar from
 * @param catalogClient The catalog client to use
 * @param logger The logger to use
 * @returns The pillar, or null if it could not be pulled
 */
export const pullPillarFromParent = async (team: GithubTeam, catalogClient: CatalogClient, logger: Logger): Promise<string | null> => {
    if (!team.parentTeam?.slug) {
        logger.warn(`Failed to pull pillar from ${team.slug}'s parent: parent not defined`)
        return null
    }
    return await getPillarForEntity({ kind: 'Component', namespace: 'default', name: team.parentTeam.slug }, catalogClient, logger)
}

/**
 * Transforms a feature team entity.
 *
 * @param entity The entity to transform
 * @param team The team to transform
 * @param ctx The transformer context
 * @param catalogClient The catalog client to use
 * @param logger The logger to use
 * @returns The transformed entity
 */
const transformFeatureTeam = async (entity: Entity, team: GithubTeam, _: TransformerContext, catalogClient: CatalogClient, logger: Logger): Promise<Entity> => {

    if (!entity.spec) {
        entity.spec = {};
    }
    if (!entity.spec.type) {
        entity.spec.type = 'team';
    }
    if (!entity.metadata.tags) {
        entity.metadata.tags = [];
    }
    if (!entity.metadata.tags.includes('scrum-team')) {
        entity.metadata.tags.push('scrum-team')
    }
    if (!entity.metadata.annotations) {
        entity.metadata.annotations = {};
    }

    const pillar = await pullPillarFromParent(team, catalogClient, logger)
    if (pillar) {
        entity.metadata.annotations['zerofox.com/pillar'] = pillar
        logger.info(`Set pillar to team ${team.slug} from parent team ${team?.parentTeam?.slug} to ${pillar}`)
    }
    return entity
}

/**
 * Transforms a pillar team entity.
 * 
 * @param entity The entity to transform
 * @param team The team to transform
 * @param ctx The transformer context
 * @param catalogClient The catalog client to use
 * @param logger The logger to use
 * @returns The transformed entity
 */
const transformPillarTeam = async (entity: Entity, team: GithubTeam, _: TransformerContext, catalogClient: CatalogClient, logger: Logger): Promise<Entity> => {
    if (!entity.spec) {
        entity.spec = {};
    }
    entity.spec.type = 'pillar'

    const ref = { kind: 'Component', namespace: 'default', name: team.slug }
    const pillar = await getPillarForEntity(ref, catalogClient, logger)
    if (!pillar) {
        logger.warn(`Failed to pull pillar from ${team.slug}'s parent: ${stringifyEntityRef(ref)} entity has no pillar defined`)
        return entity
    }

    if (!entity.metadata.annotations) {
        entity.metadata.annotations = {};
    }
    entity.metadata.annotations['zerofox.com/pillar'] = pillar
    entity.metadata.annotations['grafana/tag-selector'] = pillar.toLowerCase()
    logger.info(`Set pillar to team ${team.slug} from ${stringifyEntityRef(ref)} to ${pillar}`)

    return entity
}

/**
 * Checks if the entity is a pillar team.
 * 
 * @param entity The entity to check
 * @returns True if the entity is a pillar team
 */
export const isPillarTeam = (entity: Entity): boolean => {
    return entity.metadata?.name?.endsWith('-pillar')
}

export const buildEntityProviderOptions = (env: PluginEnvironment): GithubOrgEntityProviderOptions => {
    return {
        id: 'production',
        orgUrl: 'https://github.com/riskive',
        logger: env.logger,
        schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { minutes: 60 },
            timeout: { minutes: 15 },
        }),
        teamTransformer: async (team, ctx) => {
            const entity = await defaultOrganizationTeamTransformer(team, ctx);
            if (!entity) {
                return
            }

            const catalogClient = new CatalogClient({
                discoveryApi: env.discovery,
            });

            switch (true) {
                case isFeatureTeam(entity):
                    return await transformFeatureTeam(entity, team, ctx, catalogClient, env.logger);

                case isPillarTeam(entity):
                    return transformPillarTeam(entity, team, ctx, catalogClient, env.logger);

                default:
                    return entity;
            }
        },
    }
}