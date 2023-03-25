import { ConfigApi } from '@backstage/core-plugin-api';
import { SingleInstanceGithubCredentialsProvider } from '@backstage/integration';
import { ScmIntegrations, GithubCredentials } from '@backstage/integration';
import { Octokit } from '@octokit/core';
import { Logger } from 'winston';
import {
  PillarAdoptionReport,
  PillarAdoptionServiceAPI,
} from '@internal/plugin-reporting-common';
import { CatalogClient } from '@backstage/catalog-client';

export default class PillarAdoptionService implements PillarAdoptionServiceAPI {
  private config: ConfigApi;
  private logger: Logger;
  private catalogClient: CatalogClient;

  constructor(config: ConfigApi, logger: Logger, catalogClient: CatalogClient) {
    this.config = config;
    this.logger = logger;
    this.catalogClient = catalogClient;
  }

  protected async getGithubCredentials(): Promise<GithubCredentials> {
    const integrations = ScmIntegrations.fromConfig(this.config);
    const ghIntegration = integrations.github.byHost('github.com');

    if (!ghIntegration) {
      throw new Error('No GitHub integration config found, please add config');
    }
    const ghCredentialsProvider =
      SingleInstanceGithubCredentialsProvider.create(ghIntegration.config);

    const host = ghIntegration.config.host;
    const orgUrl = `https://${host}/riskive`;

    return await ghCredentialsProvider.getCredentials({
      url: orgUrl,
    });
  }

  protected async listAllGithubRepos(): Promise<string[]> {
    const { headers } = await this.getGithubCredentials();

    const octokit = new Octokit({
      auth: headers?.Authorization,
    });

    const pageSize = 100;
    let page = 0;
    let repos: string[] = [];
    this.logger.info('>>>>here');

    while (true) {
      const { data } = await octokit.request('GET /orgs/{org}/repos', {
        org: 'riskive',
        type: 'all',
        per_page: pageSize,
        page: page,
      });

      repos = repos.concat(data.map(({ full_name }) => full_name));

      if (data.length < pageSize) {
        break;
      }
      page++;
    }
    this.logger.info('>>>>here' + JSON.stringify(repos));

    return Promise.resolve(repos);
  }

  protected async listAllAzureRepos(): Promise<string[]> {
    return Promise.resolve([]);
  }

  protected async listAllRepos(): Promise<Set<string>> {
    const githubRepos = await this.listAllGithubRepos();
    const azureRepos = await this.listAllAzureRepos();

    this.logger.info('>>>>githubRepos' + JSON.stringify(githubRepos));
    this.logger.info('>>>>new Set([...githubRepos, ...azureRepos])' + JSON.stringify(new Set([...githubRepos, ...azureRepos])));

    return new Set([...githubRepos, ...azureRepos]);
  }

  protected async getAdoptingRepos(repos: Set<string>): Promise<string[]> {
    return Promise.resolve([]);
  }

  protected async getNoAdoptingRepos(repos: Set<string>): Promise<string[]> {
    return Promise.resolve([]);
  }

  async getTransitionRatioReport(): Promise<PillarAdoptionReport> {
    const repos = await this.listAllRepos();
    const adoptingRepos = await this.getAdoptingRepos(repos);
    const nonAdoptingRepos = await this.getNoAdoptingRepos(repos);

    return {
      totalRepos: repos.size,
      totalPillarRepos: adoptingRepos.length,
      totalPillarReposPercentage: Math.round(
        (adoptingRepos.length / repos.size) * 100,
      ),
      nonAdoptingRepos,
    };
  }
}
