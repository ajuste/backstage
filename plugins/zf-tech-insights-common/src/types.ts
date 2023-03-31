import {
  ComponentEntity,
  GroupEntity,
} from '@backstage/catalog-model';

/** @public */
export interface ZFCatalogAPI {
  getPillars(): Promise<Array<ComponentEntity>>;
  getPillarGlobalTeams(): Promise<Array<GroupEntity>>;
  getGlobalTeamForPillar(pillar: string): Promise<GroupEntity | undefined>;
  getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>>;
  getPillar(pillar: string): Promise<ComponentEntity | undefined>;
}
