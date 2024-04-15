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
} from 'backstage-plugin-zf-tech-insights-common';

const zfCatalogAPI = createApiExtension({
  factory: createApiFactory({
    api: zfCatalogApiRef,
    deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
    factory: ({ discoveryApi, identityApi }) => new ZFCatalogAPIClient({ discoveryApi, identityApi }),
  }),
});

export default createPlugin({
  id: 'zf-insights',
  extensions: [zfCatalogAPI],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});