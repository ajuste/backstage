import { PillarAdoptionServiceAPI, FactsServiceAPI } from '@internal/plugin-reporting-common';
import { ApiRef, createApiRef } from '@backstage/core-plugin-api';

export const pillarAdoptionApiRef: ApiRef<PillarAdoptionServiceAPI> =
  createApiRef({
    id: 'pillaradoption',
  });

export const factAiRef: ApiRef<FactsServiceAPI> =
  createApiRef({
    id: 'facts',
  });