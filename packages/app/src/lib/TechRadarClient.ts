import {
  TechRadarApi,
  TechRadarLoaderResponse,
} from '@backstage/plugin-tech-radar';
import { GithubResourceFetcherApi } from '@internal/plugin-github-resource-fetcher';

type GithubRepoDetails = {
  owner: string;
  repo: string;
  path: string;
  branch: string;
};

/**
 * This is a client for the Tech Radar API.
 * It is responsible for fetching the data from the backend.
 */
export class TechRadarClient implements TechRadarApi {
  constructor(private githubResourceFetcherApi: GithubResourceFetcherApi) {}
  async load(id: string | undefined): Promise<TechRadarLoaderResponse> {
    const details = this.getRepoDetails(id);

    const res = await this.githubResourceFetcherApi.fetch({
      owner: details.owner,
      repo: details.repo,
      branch: details.branch,
      path: details.path,
    });

    const data = JSON.parse(res);

    return {
      ...data,
      entries: data.entries.map((entry: any) => ({
        ...entry,
        timeline: entry.timeline.map((timeline: any) => ({
          ...timeline,
          date: new Date(timeline.date),
        })),
      })),
    };
  }

  getRepoDetails(id: string | undefined): GithubRepoDetails {
    switch (id) {
      case 'ui-e':
        return {
          path: '.backstage/radars/ui-e.json',
          owner: 'riskive',
          repo: 'ui-architecture',
          branch: 'master',
        };
      case 'qa':
        return {
          path: '.backstage/radars/test-quality.json',
          owner: 'riskive',
          repo: 'ui-architecture',
          branch: 'master',
        };
      case 'sre':
        return {
          path: '.backstage/radars/sre.json',
          owner: 'riskive',
          repo: 'ui-architecture',
          branch: 'master',
        };
      default:
        throw new Error('No repo details found');
    }
  }
}
