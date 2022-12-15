import { ResponseError } from '@backstage/errors';
import { createApiRef, DiscoveryApi } from '@backstage/core-plugin-api';

type FetchOptions = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

export type GithubResourceFetcherApi = {
  discovery: DiscoveryApi;
  fetch: (options: FetchOptions) => Promise<string>;
};

export const githubResourceFetcherApiRef = createApiRef<GithubResourceFetcherApi>({
  id: 'plugin.github-resource-fetcher.service',
});

export class GithubResourceFetcherRestApi implements GithubResourceFetcherApi {
  url: string = '';

  constructor(public discovery: DiscoveryApi) {}

  async fetch(options: FetchOptions): Promise<string> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('github-resource-fetcher');
    }
    const resp = await fetch(
      `${this.url}/${options.owner}/${options.repo}?path=${encodeURIComponent(
        options.path,
      )}&branch=${encodeURIComponent(options.branch)}`,
    );
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    return await resp.text();
  }
}
