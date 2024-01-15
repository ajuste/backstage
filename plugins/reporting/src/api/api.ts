import { FactsServiceAPI } from '@internal/plugin-reporting-common';
import { ApiRef, createApiRef } from '@backstage/core-plugin-api';

export const factAiRef: ApiRef<FactsServiceAPI> =
  createApiRef({
    id: 'facts',
  });