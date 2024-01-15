import {
  ComponentEntity,
  GroupEntity,
} from '@backstage/catalog-model';

/** @public */
export interface ZFCatalogAPI {
  getPillars(): Promise<Array<ComponentEntity>>;
  getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>>;
  getPillar(pillar: string): Promise<ComponentEntity | undefined>;
}
