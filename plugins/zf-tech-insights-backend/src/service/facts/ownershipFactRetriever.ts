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
    hasUserOwner(entity: Entity): boolean {
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
    hasTeamOwner(entity: Entity): boolean {
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
    hasPillar(entity: Entity): boolean {
        return !!entity.metadata.annotations?.['zerofox.com/pillar'] ?? false;
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
                        hasPillar: this.hasPillar(entity),
                        hasTeamOwner: this.hasTeamOwner(entity),
                        hasUserOwner: this.hasUserOwner(entity),
                    }
                };
                result.push(response);
                this.context.logger.info(`Ownership facts for ${entity.metadata.name}: ${JSON.stringify(response)}`);

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
    version: '0.0.4',
    title: 'Entity Ownership',
    description:
        'Generates ownership level facts for entities',
    entityFilter: [
        {
            "kind": 'Component',
            "metadata.annotations.github.com/project-slug": CATALOG_FILTER_EXISTS,
        },
        {
            "kind": 'System',
        },
        {
            "kind": 'API',
        },
        {
            "kind": 'Component',
            "metadata.annotations.backstage.io/source-location": CATALOG_FILTER_EXISTS,
            "spec.type": "library",
        }
    ],
    schema: {
        hasPillar: {
            type: 'boolean',
            description: 'Has pillar defined',
        },
        hasTeamOwner: {
            type: 'boolean',
            description: 'There is a team owner',
        },
        hasUserOwner: {
            type: 'boolean',
            description: 'There is a user owner',
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