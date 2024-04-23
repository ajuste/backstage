import {
  ApiRef,
  createApiRef,
  ConfigApi,
} from '@backstage/core-plugin-api';
import { NomadAPI, NomadJob } from '../types';

export const nomadApiRef: ApiRef<NomadAPI> = createApiRef({
  id: 'nomad-hashi',
});

export class NomadAPIClient implements NomadAPI {

  private configApi: ConfigApi;

  constructor(
    configApi: ConfigApi,
  ) {
    this.configApi = configApi;
  }

  async getJobs(): Promise<NomadJob[]> {
    const response = await fetch(`${this.configApi.getString('nomad.addr')}/v1/jobs`)
    return await response.json() as NomadJob[]
  }
}