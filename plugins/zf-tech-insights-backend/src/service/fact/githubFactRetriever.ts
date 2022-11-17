import {
    FactRetriever,
    FactRetrieverContext,
    TechInsightFact,
} from '@backstage/plugin-tech-insights-node';
import { useApi, githubAuthApiRef } from '@backstage/core-plugin-api';
import { DateTime } from 'luxon';
import { CatalogClient, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { Octokit } from "@octokit/rest";


/**
 * Generates facts which indicate the quality of data in the spec.owner field.
 *
 * @public
 */
export const githubFactRetriever: FactRetriever = {
    id: 'githubFactRetriever',
    version: '0.0.1',
    title: 'Entity Ownership',
    description:
        'Generates facts for entities that are pulled from github such as last commit date, etc.',
    entityFilter: [
        {
            "metadata.annotations.github.com/project-slug": CATALOG_FILTER_EXISTS,
        },
    ],
    schema: {
        lastCommit: {
            type: 'datetime',
            description: 'Last commit date',
        },
    },
    handler: async ({
        discovery,
        entityFilter,
        tokenManager,
    }: FactRetrieverContext) => {

        const { token } = await tokenManager.getToken();
        const catalogClient = new CatalogClient({
            discoveryApi: discovery,
        });
        const entities = await catalogClient.getEntities(
            { filter: entityFilter },
            { token },
        );

        const githubAuthApi = useApi(githubAuthApiRef);
        const ghToken = await githubAuthApi.getAccessToken(['repo']);

        return await Promise.all(

            entities.items.map((entity: Entity) => {

                return new Promise<TechInsightFact>(async (res, rej) => {

                    try {

                        const baseUrl = "";
                        const octokit = new Octokit({
                            auth: ghToken,
                            baseUrl,
                        })

                        const slug = entity.metadata.annotations?.['github.com/project-slug'];

                        const [owner, repo] = slug ? slug.split('/') : [];

                        const listCommitResponse = await octokit.rest.repos.listCommits({
                            owner, repo,
                            per_page: 1,
                        });

                        const lastCommit = listCommitResponse?.data[0]?.commit?.author?.date;

                        res({
                            entity: {
                                namespace: entity.metadata.namespace!,
                                kind: entity.kind,
                                name: entity.metadata.name,
                            },
                            facts: {
                                lastCommit: lastCommit ? DateTime.fromISO(lastCommit) : DateTime.fromMillis(0),
                            },
                        })

                    } catch (e) {
                        rej(e);
                    }
                });
            }));
    },
};