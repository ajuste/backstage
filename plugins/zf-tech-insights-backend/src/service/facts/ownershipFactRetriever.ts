import {
    FactRetriever,
    FactRetrieverContext,
    TechInsightFact,
} from '@backstage-community/plugin-tech-insights-node';
import { CatalogClient, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { Entity, CompoundEntityRef, EntityRelation, } from '@backstage/catalog-model';

type RelationWithTarget = EntityRelation & {
    target: CompoundEntityRef;
};


/**
 * Fetches onwership facts.
 */
export class OwnershipFactRetriever {
    context: FactRetrieverContext;
    constructor(context: FactRetrieverContext) {
        this.context = context;
    }

    /**
     * Validates if an entity has a user owner.
     * @param entity 
     * @returns 
     */
    private hasUserOwner(entity: Entity): boolean {
        return entity.relations?.some((relation) => {
            const r = (relation as RelationWithTarget);
            return r.type === 'ownedBy' && r.target?.kind === 'user';
        }) ?? false;
    }

    /**
     * Validates if an entity has a team owner.
     * @param entity 
     * @returns 
     */
    private hasTeamOwner(entity: Entity): boolean {
        return entity.relations?.some((relation) => {
            const r = (relation as RelationWithTarget);
            return r.type === 'ownedBy' && r.target?.kind === 'group' && r.target?.name.startsWith('team-');
        }) ?? false;
    }

    /**
     * Validates if an entity has a pillar.
     * @param entity
     * @returns 
     */
    private hasPillar(entity: Entity): boolean {
        return !!entity.metadata.annotations?.['zerofox.com/pillar'] ?? false;
    }

    /**
     * Get ownership level for an entity.
     * @param entity 
     * @returns 
     */
    getOwnershipLevel(entity: Entity): string {
        if (!this.hasUserOwner(entity) && !this.hasTeamOwner(entity) && !this.hasPillar(entity)) {
            return 'no-owner';
        }
        if (!this.hasPillar(entity)) {
            return 'no-pillar';
        }
        if (!this.hasTeamOwner(entity)) {
            return 'no-team-owner';
        }
        if (!this.hasUserOwner(entity)) {
            return 'no-user-owner';
        }
        return 'full';
    }

    /**
     * Fetch facts.
     * 
     * @returns Facts for all entities that match the entity filter.
     */
    async fetchFacts(): Promise<TechInsightFact[]> {

        const { token } = await this.context.tokenManager.getToken();
        const catalogClient = new CatalogClient({
            discoveryApi: this.context.discovery,
        });
        const entities = await catalogClient.getEntities(
            { filter: this.context.entityFilter },
            { token },
        );
        const result = Array<TechInsightFact>();

        for (const entity of entities.items) {
            try {
                this.context.logger.info(`Fetching ownership facts for ${entity.metadata.name}`);
                const response = {
                    entity: {
                        namespace: entity.metadata.namespace!,
                        kind: entity.kind,
                        name: entity.metadata.name,
                    },
                    facts: {
                        ownershipLevel: this.getOwnershipLevel(entity),
                    }
                };
                result.push(response);

            } catch (error) {
                this.context.logger.error(`Error while fetching github facts for ${entity.metadata.name}: ${error}`)
            }
        }
        return result;
    }
}

/**
 * Generates facts for ownership.
 *
 * @public
 */
const ownershipFactRetriever: FactRetriever = {
    id: 'ownershipFactRetriever',
    version: '0.0.1',
    title: 'Entity Ownership',
    description:
        'Generates ownership level facts for entities',
    entityFilter: [
        {
            "metadata.annotations.github.com/project-slug": CATALOG_FILTER_EXISTS,
        },
    ],
    schema: {
        ownershipLevel: {
            type: 'string',
            description: 'Level of ownership for this entity',
        },
    },
    handler: async (context: FactRetrieverContext): Promise<Array<TechInsightFact>> => {
        const retriever = new OwnershipFactRetriever(context);
        return retriever.fetchFacts();
    },
};

export function getOwnershipFactRetriever() {
    return ownershipFactRetriever;
}