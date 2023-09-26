import { configApiRef, createApiFactory, createComponentExtension, createPlugin, discoveryApiRef, identityApiRef } from '@backstage/core-plugin-api';
import { UnifiedAlertingGrafanaApiClient, grafanaApiRef } from './api';


export const grafanaPlugin = createPlugin({
  id: 'zerofoxGrafana',
  apis: [
    createApiFactory({
      api: grafanaApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef, configApi: configApiRef },
      factory: ({ discoveryApi, identityApi, configApi }) => {
        return new UnifiedAlertingGrafanaApiClient({
          discoveryApi: discoveryApi,
          identityApi: identityApi,
          domain: configApi.getString('grafana.domain'),
          proxyPath: configApi.getOptionalString('grafana.proxyPath'),
        });
      },
    }),
  ],
});

export const EntityGrafanaDashboardsCard = grafanaPlugin.provide(
  createComponentExtension({
    name: 'EntityGrafanaDashboardsCard',
    component: {
      lazy: () =>
        import('./components/DashboardsCard').then(m => m.DashboardsCard),
    },
  })
);

export const EntityGrafanaAlertsCard = grafanaPlugin.provide(
  createComponentExtension({
    name: 'EntityGrafanaAlertsCard',
    component: {
      lazy: () =>
        import('./components/AlertsCard').then(m => m.AlertsCard),
    },
  })
);