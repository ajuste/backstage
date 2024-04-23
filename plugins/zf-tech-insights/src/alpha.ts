import {
  createPlugin,
  createApiFactory,
  createApiExtension,
  identityApiRef,
  discoveryApiRef,
} from '@backstage/frontend-plugin-api';
import { convertLegacyRouteRefs } from '@backstage/core-compat-api'
import { rootRouteRef } from './routes';
import {
  ZFCatalogAPIClient,
  zfCatalogApiRef,
  nomadApiRef,
} from 'backstage-plugin-zf-tech-insights-common';

import {
  NomadAPIClient
} from './api';

const zfCatalogAPI = createApiExtension({
  factory: createApiFactory({
    api: zfCatalogApiRef,
    deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
    factory: ({ discoveryApi, identityApi }) => new ZFCatalogAPIClient({ discoveryApi, identityApi }),
  }),
});

const nomadAPI = createApiExtension({
  factory: createApiFactory({
    api: nomadApiRef,
    deps: { discoveryApi: discoveryApiRef },
    factory: ({ discoveryApi }) => new NomadAPIClient(discoveryApi),
  }),
});

export default createPlugin({
  id: 'zf-insights',
  extensions: [zfCatalogAPI, nomadAPI],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});