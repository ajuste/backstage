import {
  CompoundEntityRef,
} from '@backstage/catalog-model';

import { JsonObject, JsonArray, JsonPrimitive } from '@backstage/types';

/** @public */
export interface PillarAdoptionServiceAPI {
  getTransitionRatioReport(): Promise<PillarAdoptionReport>;
}

/** @public */
export type PillarAdoptionReport = {
  totalRepos: number;
  totalPillarRepos: number;
  totalPillarReposPercentage: number;
  nonAdoptingRepos: string[];
};

/** @public */
export interface FactsServiceAPI {
  getEntitiesFactValues(factRetrieverId: string, factId: string): Promise<FactsReport[]>;
};

/** @public */
export type FactsReport = {
  factRetrieverId: string;
  factId: string;
  factValue: JsonObject | JsonArray | JsonPrimitive;
  entityRef: CompoundEntityRef;
};