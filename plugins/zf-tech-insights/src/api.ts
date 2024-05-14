import { DiscoveryApi } from '@backstage/core-plugin-api';
import { NomadAPI, NomadJob, GetJobsOptions } from 'backstage-plugin-zf-tech-insights-common';

export class NomadAPIClient implements NomadAPI {
  url: string = '';

  constructor(public discovery: DiscoveryApi) { }

  async getJobs(options: GetJobsOptions): Promise<Array<NomadJob>> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('zf-insights');
    }
    const res = await fetch(`${this.url}/nomad/jobs?${options.filter ? `&filter=${encodeURIComponent(options.filter)}` : ''}`)
    return res.json() as Promise<Array<NomadJob>>;
  }
}