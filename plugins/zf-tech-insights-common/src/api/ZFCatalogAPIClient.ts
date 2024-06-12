import {
  DiscoveryApi,
  IdentityApi,
  ApiRef,
  createApiRef,
} from '@backstage/core-plugin-api';
import { ZFCatalogAPI } from '../types';
import { ComponentEntity, GroupEntity } from '@backstage/catalog-model';

export const zfCatalogApiRef: ApiRef<ZFCatalogAPI> = createApiRef({
  id: 'zfcatalog',
});

export class ZFCatalogAPIClient implements ZFCatalogAPI {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }

  private async internalGet(path: string): Promise<any> {
    const url = `${await this.discoveryApi.getBaseUrl('zf-insights')}${path}`;
    const { token: idToken } = await this.identityApi.getCredentials();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
    });

    if (!response.ok) {
      const payload = await response.text();
      const message = `Request failed with ${response.status} ${response.statusText}, ${payload}`;
      throw new Error(message);
    }

    return await response.json();
  }

  async getPillars(): Promise<Array<ComponentEntity>> {
    return await this.internalGet('/pillar');
  }

  async getPillar(pillar: string): Promise<ComponentEntity | undefined> {
    return await this.internalGet(`/pillar/${pillar}`);
  }

  async getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>> {
    return await this.internalGet(`/pillar/${pillar}/teams`);
  }
  
  async getStandaloneEntities(): Promise<Array<ComponentEntity>> {
    return await this.internalGet(`/entities/with-repo`);
  }
}
