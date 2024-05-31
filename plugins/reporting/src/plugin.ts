import {
  rootRouteRef,
  codeCoverageRouteRef,
  serviceStalenessRouteRef,
} from './routes';
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { techInsightsApiRef } from '@backstage-community/plugin-tech-insights';
import { factAiRef } from './api/api';
import FactServiceClient from './api/FactServiceClient';

export const reportingPlugin = createPlugin({
  id: 'reporting',
  apis: [

    createApiFactory({
      api: factAiRef,
      deps: { catalogApi: catalogApiRef, techInsightsApi: techInsightsApiRef },
      factory: ({ catalogApi, techInsightsApi }) =>
        new FactServiceClient(catalogApi, techInsightsApi),
    }),
  ],
  routes: {
    root: rootRouteRef,
    codeCoverage: codeCoverageRouteRef,
    serviceStaleness: serviceStalenessRouteRef,
  },
});

export const ReportingPage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'ReportingPage',
    component: () =>
      import('./components/CatalogComponent').then(m => m.CatalogComponent),
    mountPoint: rootRouteRef,
  }),
);

export const CodeCoveragePage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'ReportingPage',
    component: () =>
      import('./components/CodeCoverageReportComponent').then(
        m => m.CodeCoverageReportComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const StalenessPage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'ComponentStalenessPage',
    component: () =>
      import('./components/ComponentStalenessReportComponent').then(
        m => m.ComponentStalenessReportComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const EntitiesFactsPage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'EntitiesFactsPage',
    component: () =>
      import('./components/EntitiesFactReportComponent').then(
        m => m.EntitiesFactReportComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const EntitiesChecksPage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'EntitiesChecksPage',
    component: () =>
      import('./components/EntitiesChecksReportComponent').then(
        m => m.EntitiesChecksReportComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);
