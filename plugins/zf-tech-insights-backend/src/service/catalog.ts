import { ConfigApi } from '@backstage/core-plugin-api';
import { Logger } from 'winston';
import { TokenManager } from '@backstage/backend-common';
import {
  CatalogClient,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import {
  GroupEntity,
  stringifyEntityRef,
  ComponentEntity,
} from '@backstage/catalog-model';

import { ZFCatalogAPI } from 'backstage-plugin-zf-tech-insights-common';

export default class ZFCatalogService implements ZFCatalogAPI {
  private logger: Logger;
  private catalogClient: CatalogClient;
  private tokenManager: TokenManager;

  constructor(
    _: ConfigApi,
    logger: Logger,
    catalogClient: CatalogClient,
    tokenManager: TokenManager,
  ) {
    this.logger = logger;
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

  async getPillarGlobalTeams(): Promise<Array<GroupEntity>> {
    const { token } = await this.tokenManager.getToken();
    const entities = await this.catalogClient.getEntities(
      {
        filter: [
          { kind: 'Group', 'metadata.tags': 'pillar-team', 'spec.type': 'team' },
        ],
      },
      { token },
    );
    return entities.items as Array<GroupEntity>;
  }

  async getGlobalTeamForPillar(
    pillar: string,
  ): Promise<GroupEntity | undefined> {
    const { token } = await this.tokenManager.getToken();
    const entities = await this.catalogClient.getEntities(
      {
        filter: [
          {
            kind: 'group',
            'metadata.tags': 'pillar-team',
            'spec.type': 'team',
            'metadata.annotations.zerofox.com/pillar': pillar,
          },
        ],
      },
      { token },
    );
    return entities.items.length
      ? (entities.items[0] as GroupEntity)
      : undefined;
  }

  async getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>> {
    const { token } = await this.tokenManager.getToken();
    const globalPillarTeam = await this.getGlobalTeamForPillar(pillar);

    this.logger.info(
      `getTeamsForPillar: globalPillarTeam: ${JSON.stringify(
        globalPillarTeam,
      )}`,
    );

    if (!globalPillarTeam) {
      return [];
    }

    const ancestorsRes = await this.catalogClient.getEntityAncestors(
      { entityRef: stringifyEntityRef(globalPillarTeam) },
      { token },
    );

    this.logger.debug(
      `getTeamsForPillar: ancestorsRes: ${JSON.stringify(ancestorsRes)}`,
    );

    const teamsForPillar = (
      await Promise.all(
        ancestorsRes.items
          .filter(e => e.entity?.kind == 'Group')
          .map(e => e.entity?.relations)
          .flat()
          .filter(r => r?.type == 'parentOf')
          .map(e => e?.targetRef)
          .filter(e => e)
          .flat()
          .map(entityRef =>
            this.catalogClient.getEntityByRef(entityRef as string),
          ),
      )
    )
      .map(entity => entity as GroupEntity)
      .flat();

    this.logger.debug(
      `getTeamsForPillar: teamsForPillar: ${JSON.stringify(teamsForPillar)}`,
    );
    return teamsForPillar;
  }
}
