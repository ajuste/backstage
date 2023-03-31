import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import {
  ZFCatalogAPIClient,
  zfCatalogApiRef,
} from 'backstage-plugin-zf-tech-insights-common';

export const zfTechInsightsPlugin = createPlugin({
  id: 'zf-insights',

  apis: [
    createApiFactory({
      api: zfCatalogApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new ZFCatalogAPIClient({ discoveryApi, identityApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});
