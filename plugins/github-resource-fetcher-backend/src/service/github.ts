import { ConfigApi } from '@backstage/core-plugin-api';
import { SingleInstanceGithubCredentialsProvider } from '@backstage/integration';
import { ScmIntegrations } from '@backstage/integration';
import { Octokit } from '@octokit/core';

export default class Github {
  private config: ConfigApi;

  constructor(config: ConfigApi) {
    this.config = config;
  }

  async fetch(
    owner: string,
    repo: string,
    branch: string,
    path: string,
  ): Promise<string> {
    const integrations = ScmIntegrations.fromConfig(this.config);
    const ghIntegration = integrations.github.byHost('github.com');

    if (!ghIntegration) {
      throw new Error('No GitHub integration config found, please add config');
    }
    const ghCredentialsProvider =
      SingleInstanceGithubCredentialsProvider.create(ghIntegration.config);

    const host = ghIntegration.config.host;
    const orgUrl = `https://${host}/${owner}`;

    const { headers } = await ghCredentialsProvider.getCredentials({
      url: orgUrl,
    });

    const octokit = new Octokit({
      auth: headers?.Authorization,
    });

    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}{?ref}',
      {
        owner,
        repo,
        path,
        ref: branch,
      },
    );

    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
}
