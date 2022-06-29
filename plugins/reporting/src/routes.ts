import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'reporting',
});

export const codeCoverageRouteRef = createRouteRef({
  id: 'code-coverage',
});
