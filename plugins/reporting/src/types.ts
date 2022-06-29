import { CompoundEntityRef } from '@backstage/catalog-model';

export type JsonCoverageHistory = {
  entity: CompoundEntityRef;
  history: Array<AggregateCoverage>;
};

export type AggregateCoverage = {
  timestamp: number;
  line: {
    available: number;
    covered: number;
    missed: number;
    percentage: number;
  };
  branch: {
    available: number;
    covered: number;
    missed: number;
    percentage: number;
  };
};

export type CodeCoverageApi = {
  getCoverageHistoryForEntity: (
    entity: CompoundEntityRef,
    limit?: number,
  ) => Promise<JsonCoverageHistory>;
};