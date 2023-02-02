import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'reporting',
});

export const codeCoverageRouteRef = createRouteRef({
  id: 'code-coverage',
});

export const serviceStalenessRouteRef = createRouteRef({
  id: 'service-staleness',
});
