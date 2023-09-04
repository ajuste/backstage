import fs from 'fs';
import os from 'os';
import path from 'path';

import {
    FactRetriever,
    FactRetrieverContext,
    TechInsightFact,
} from '@backstage/plugin-tech-insights-node';
import { DateTime } from 'luxon';
import { CatalogClient, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
    ScmIntegrations,
    SingleInstanceGithubCredentialsProvider,
    GithubCredentials,
} from '@backstage/integration';

import { graphql } from '@octokit/graphql';
import simpleGit from 'simple-git';


import { Project, TerraformVersionAnalyzeResult } from '../../project-analyzer';

type GithubAPIFacts = {
    lastCommit: DateTime | null;
    msSinceLastCommit: number | null;
}

type ProjectAnalysisFacts = {
    terraformVersion: string | null;
}


/**
 * Fetches facts from the GitHub API.
 */
class GithubFactRetriever {
    context: FactRetrieverContext;
    constructor(context: FactRetrieverContext) {
        this.context = context;
    }

    /**
     * Clones a git repo to a destination path.
     * 
     * @param slug Project slug in the format of owner/repo
     * @param destinationPath Destination path to clone the repo to
     */
    async cloneRepo(slug: string, destinationPath: string) {
        const git = simpleGit();
        const cloneUrl = `git@github.com:${slug}.git`;
        await git.clone(cloneUrl, destinationPath);
    }

    /**
     * Creates a temporary folder in the systems temporary directory.
     * 
     * @returns Path to the temporary folder
     */
    async createTempFolder(): Promise<string> {
        const tmpDirectory = os.tmpdir();

        const folderName = `temp-${Date.now()}`;
        const tempFolderPath = path.join(tmpDirectory, folderName);

        // Create the folder
        fs.mkdirSync(tempFolderPath);

        return tempFolderPath;
    }

    /**
     * Fetches facts from the GitHub by cloning the repo.
     */
    async fetchProjectAnalysis(slug: string): Promise<ProjectAnalysisFacts> {
        const tempFolder = await this.createTempFolder();
        const res = {} as ProjectAnalysisFacts;

        try {
            this.context.logger.info(`Cloning repo ${slug} to ${tempFolder}`);
            await this.cloneRepo(slug, tempFolder);
            const project = new Project(tempFolder);
            const analysis = await project.analyze();

            const terraformVersion = analysis.matches.find((match) => match.result instanceof TerraformVersionAnalyzeResult);
            if (terraformVersion) {
                this.context.logger.info(`Found terraform version ${(terraformVersion.result as TerraformVersionAnalyzeResult).terraformVersion} for ${slug}`);
                res.terraformVersion = (terraformVersion.result as TerraformVersionAnalyzeResult).terraformVersion
            } else {
                this.context.logger.info(`No terraform version found for ${slug}`);
            }
        }
        finally {
            fs.rmdirSync(tempFolder, { recursive: true });
            this.context.logger.info(`Removed temporary folder ${tempFolder} after analysis`);
        }
        return res
    }

    /**
     * Gets the credentials for the GitHub API.
     * 
     * @param slug Project slug in the format of owner/repo
     */
    private async getCredentials(slug: string): Promise<GithubCredentials> {
        const integrations = ScmIntegrations.fromConfig(this.context.config);
        const ghIntegration = integrations.github.byHost("github.com");

        if (!ghIntegration) {
            throw new Error(
                'No GitHub integration config found, please add config',
            );
        }
        const ghCredentialsProvider = SingleInstanceGithubCredentialsProvider.create(ghIntegration.config);
        const ghHost = ghIntegration.config.host;

        const [owner, _] = slug ? slug.split('/') : [];
        const orgUrl = `https://${ghHost}/${owner}`;

        return await ghCredentialsProvider.getCredentials({
            url: orgUrl,
        });
    }

    /**
     * Fetches facts from the GitHub API.
     * 
     * @param slug Project slug in the format of owner/repo
     * @returns Facts from the GitHub API
     */
    async fetchGithubAPIFacts(slug: string): Promise<GithubAPIFacts> {

        const { headers } = await this.getCredentials(slug);
        const [owner, repo] = slug ? slug.split('/') : [];

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

        return {
            lastCommit: lastCommit ? DateTime.fromISO(lastCommit) : DateTime.fromMillis(0),
            msSinceLastCommit: lastCommit ? Math.abs(DateTime.fromISO(lastCommit).diffNow().as('milliseconds')) : null,
        }
    }

    /**
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
            this.context.logger.info(`Fetching github facts for ${entity.metadata.name}`);

            const slug = entity.metadata.annotations?.['github.com/project-slug'];
            if (!slug) {
                throw new Error(
                    `No github.com/project-slug annotation found for entity ${entity.metadata.name}`
                );
            }

            const response = {
                entity: {
                    namespace: entity.metadata.namespace!,
                    kind: entity.kind,
                    name: entity.metadata.name,
                },
                facts: {}
            };

            const githubAPIFacts = await this.fetchGithubAPIFacts(slug);
            const projectAnalysisFacts = await this.fetchProjectAnalysis(slug);

            this.context.logger.info(`Fetched github facts for ${entity.metadata.name}: ${JSON.stringify(githubAPIFacts)} ${JSON.stringify(projectAnalysisFacts)}`);

            response.facts = Object.assign({}, githubAPIFacts, projectAnalysisFacts);

            result.push(response);
        }
        return result;
    }
}

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
        terraformVersion: {
            type: 'string',
            description: 'Terraform version',
        },
    },
    handler: async ({
        discovery,
        entityFilter,
        tokenManager,
        config,
        logger,
    }: FactRetrieverContext): Promise<Array<TechInsightFact>> => {
        const retriever = new GithubFactRetriever({
            discovery,
            entityFilter,
            tokenManager,
            config,
            logger,
        });
        return retriever.fetchFacts();
    },


};

export function getGithubFactRetriever() {
    return githubFactRetriever;
}