import { ConfigApi } from '@backstage/core-plugin-api';
import { TokenManager } from '@backstage/backend-common';
import {
  CatalogClient,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import {
  GroupEntity,
  ComponentEntity,
} from '@backstage/catalog-model';

import { ZFCatalogAPI } from 'backstage-plugin-zf-tech-insights-common';

export default class ZFCatalogService implements ZFCatalogAPI {
  private catalogClient: CatalogClient;
  private tokenManager: TokenManager;

  constructor(
    _: ConfigApi,
    catalogClient: CatalogClient,
    tokenManager: TokenManager,
  ) {
    this.catalogClient = catalogClient;
    this.tokenManager = tokenManager;
  }

  async getPillars(): Promise<Array<ComponentEntity>> {
    const { token } = await this.tokenManager.getToken();
    const entities = await this.catalogClient.getEntities(
      {
        filter: {
          'metadata.annotations.zerofox.com/pillar': CATALOG_FILTER_EXISTS,
          kind: 'Component',
          'spec.type': 'pillar',
        },
      },
      { token },
    );
    return entities.items as Array<ComponentEntity>;
  }

  async getPillar(pillar: string): Promise<ComponentEntity | undefined> {
    const { token } = await this.tokenManager.getToken();
    const entities = await this.catalogClient.getEntities(
      {
        filter: {
          'metadata.annotations.zerofox.com/pillar': pillar,
          kind: 'Component',
          'spec.type': 'pillar',
        },
      },
      { token },
    );
    return entities.items.length
      ? (entities.items[0] as ComponentEntity)
      : undefined;
  }

  async getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>> {
    const { token } = await this.tokenManager.getToken();
    const entities = await this.catalogClient.getEntities(
      {
        filter: [
          {
            kind: 'group',
            'spec.type': 'team',
            'metadata.tags': 'scrum-team',
            'metadata.annotations.zerofox.com/pillar': pillar,
          },
        ],
      },
      { token },
    );
    return entities.items as Array<GroupEntity>;
  }
}
