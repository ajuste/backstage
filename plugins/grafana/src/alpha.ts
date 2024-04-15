import {
  createPlugin,
  createApiFactory,
  createApiExtension,
  identityApiRef,
  discoveryApiRef,
  configApiRef,
} from '@backstage/frontend-plugin-api';
import { UnifiedAlertingGrafanaApiClient, grafanaApiRef } from './api';

const zfCatalogAPI = createApiExtension({
  factory: createApiFactory({
    api: grafanaApiRef,
    deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef, configApi: configApiRef },
    factory: ({ discoveryApi, identityApi, configApi }) => new UnifiedAlertingGrafanaApiClient({
      discoveryApi: discoveryApi,
      identityApi: identityApi,
      domain: configApi.getString('grafana.domain'),
      proxyPath: configApi.getOptionalString('grafana.proxyPath'),
    }),
  }),
});

export default createPlugin({
  id: 'zerofoxGrafana',
  extensions: [zfCatalogAPI],
  // routes: convertLegacyRouteRefs({
  //   root: rootRouteRef,
  // }),
});