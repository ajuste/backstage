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
  nomadApiRef,
} from 'backstage-plugin-zf-tech-insights-common';

import {
  NomadAPIClient,
} from './api';

export const zfTechInsightsPlugin = createPlugin({
  id: 'zf-insights',
  apis: [
    createApiFactory({
      api: zfCatalogApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new ZFCatalogAPIClient({ discoveryApi, identityApi }),
    }),
    createApiFactory({
      api: nomadApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory: ({ discoveryApi }) =>
        new NomadAPIClient(discoveryApi),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});
