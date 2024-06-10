import {
  ConfigApi,
} from '@backstage/core-plugin-api';
import { NomadAPI, NomadJob, GetJobsOptions } from 'backstage-plugin-zf-tech-insights-common';

export default class NomadProxyAPIClient implements NomadAPI {

  private configApi: ConfigApi;

  constructor(
    configApi: ConfigApi,
  ) {
    this.configApi = configApi;
  }

  async getJobs(options: GetJobsOptions): Promise<NomadJob[]> {
    const token = this.configApi.getString("nomad.token");
    const response = await fetch(`${this.configApi.getString('nomad.addr')}/v1/jobs?${options.filter ? `&filter=${encodeURIComponent(options.filter)}` : ''}`, {
      headers: { "X-Nomad-Token": token }
    });
    return await response.json() as NomadJob[]
  }
}