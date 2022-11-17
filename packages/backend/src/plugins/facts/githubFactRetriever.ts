import {
    FactRetriever,
    FactRetrieverContext,
    TechInsightFact,
} from '@backstage/plugin-tech-insights-node';
import { DateTime } from 'luxon';
import { CatalogClient, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import {
    ScmIntegrations,
    SingleInstanceGithubCredentialsProvider,
} from '@backstage/integration';

import { graphql } from '@octokit/graphql';


/**
 * Generates facts which indicate the quality of data in the spec.owner field.
 *
 * @public
 */
const githubFactRetriever: FactRetriever = {
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
        msSinceLastCommit: {
            type: 'integer',
            description: 'Milliseconds since last commit',
        },
    },
    handler: async ({
        discovery,
        entityFilter,
        tokenManager,
        config,
    }: FactRetrieverContext) => {

        const integrations = ScmIntegrations.fromConfig(config);
        const ghIntegration = integrations.github.byHost("github.com");

        if (!ghIntegration) {
            throw new Error(
                'No GitHub integration config found, please add config',
            );
        }
        const ghCredentialsProvider = SingleInstanceGithubCredentialsProvider.create(ghIntegration.config);
        const ghHost = ghIntegration.config.host;

        const { token } = await tokenManager.getToken();
        const catalogClient = new CatalogClient({
            discoveryApi: discovery,
        });
        const entities = await catalogClient.getEntities(
            { filter: entityFilter },
            { token },
        );

        return await Promise.all(

            entities.items.map((entity: Entity) => {

                return new Promise<TechInsightFact>(async (res, rej) => {

                    try {

                        const slug = entity.metadata.annotations?.['github.com/project-slug'];

                        const [owner, repo] = slug ? slug.split('/') : [];
                        const orgUrl = `https://${ghHost}/${owner}`;

                        const { headers } = await ghCredentialsProvider.getCredentials({
                            url: orgUrl,
                        });

                        const response: any = await graphql(`
                            {
                            repository(owner: "${owner}", name: "${repo}") {
                                ref(qualifiedName: "master") {
                                  target {
                                    ... on Commit {
                                      history(first: 10) {
                                        pageInfo {
                                          hasNextPage
                                          endCursor
                                        }
                                        edges {
                                          node {
                                            oid
                                            messageHeadline
                                            committedDate
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            `,
                            {
                                headers,
                            });

                        const lastCommit: string | null = response?.repository?.ref?.target?.history?.edges[0]?.node?.committedDate;

                        res({
                            entity: {
                                namespace: entity.metadata.namespace!,
                                kind: entity.kind,
                                name: entity.metadata.name,
                            },
                            facts: {
                                lastCommit: lastCommit ? DateTime.fromISO(lastCommit) : DateTime.fromMillis(0),
                                msSinceLastCommit: lastCommit ? DateTime.fromISO(lastCommit).diffNow().as('milliseconds') : null,
                            },
                        })

                    } catch (e) {
                        rej(e);
                    }
                });
            }));
    },
};

export default githubFactRetriever;