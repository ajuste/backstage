import { PillarAdoptionServiceAPI } from '@internal/plugin-reporting-common';
import { ApiRef, createApiRef } from '@backstage/core-plugin-api';

export const pillarAdoptionApiRef: ApiRef<PillarAdoptionServiceAPI> =
  createApiRef({
    id: 'pillaradoption',
  });
