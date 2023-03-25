import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import {
  PillarAdoptionReport,
  PillarAdoptionServiceAPI,
} from '@internal/plugin-reporting-common';

export default class PillarAdoptionClient implements PillarAdoptionServiceAPI {
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
    const url = `${await this.discoveryApi.getBaseUrl('reporting')}${path}`;
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

  async getTransitionRatioReport(): Promise<PillarAdoptionReport> {
    return await this.internalGet('/pillar-adoption/ratio');
  }
}
