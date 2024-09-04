import { ResponseError } from '@backstage/errors';
import {
  DiscoveryApi,
  ApiRef,
  createApiRef,
} from '@backstage/core-plugin-api';
import { RDSAPI, RDSDatabase, RDSTable } from 'backstage-plugin-zf-tech-insights-common';
import { CompoundEntityRef } from '@backstage/catalog-model';

export const rdsApiRef: ApiRef<RDSAPI> = createApiRef({
  id: 'rds',
});

export class RDSAPIClient implements RDSAPI {
  private readonly discoveryApi: DiscoveryApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
  }) {
    this.discoveryApi = options.discoveryApi;
  }

  async getDatabases(instance: CompoundEntityRef): Promise<RDSDatabase[]> {
    const url = await this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/rds/${instance.name}/`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const data = await resp.json();
    return data;
  }

  async getTables(instance: CompoundEntityRef, database: string): Promise<RDSTable[]> {
    const url = await this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/rds/${instance.name}/${database}/tables/`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const data = await resp.json();
    return data;
  }
}
