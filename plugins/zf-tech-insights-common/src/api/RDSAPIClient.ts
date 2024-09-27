import { ResponseError } from '@backstage/errors';
import {
  DiscoveryApi,
  ApiRef,
  createApiRef,
} from '@backstage/core-plugin-api';
import { RDSAPI, RDSDatabase, RDSInstance, RDSSchema, RDSTable } from 'backstage-plugin-zf-tech-insights-common';
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

  async getInstances(): Promise<RDSInstance[]> {
    const url = await this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/rds/`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const data = await resp.json();
    return data;
  }

  async getDatabases(instance: CompoundEntityRef): Promise<RDSDatabase[]> {
    const url = await this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/rds/${instance.name}/databases`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const data = await resp.json();
    return data;
  }

  async getSchemas(database: RDSDatabase): Promise<RDSSchema[]> {
    const url = await this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/rds/${database.instance.name}/databases/${database.name}/schemas/`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const data = await resp.json();
    return data;
  }

  async getTables(schema: RDSSchema): Promise<RDSTable[]> {
    const url = await this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/rds/${schema.database.instance.name}/databases/${schema.database.name}/schemas/${schema.name}/tables/`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const data = await resp.json();
    return data;
  }
}
