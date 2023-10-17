import {
  rootRouteRef,
  codeCoverageRouteRef,
  serviceStalenessRouteRef,
} from './routes';
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { techInsightsApiRef } from '@backstage/plugin-tech-insights';
import { pillarAdoptionApiRef, factAiRef } from './api/api';
import PillarAdoptionClient from './api/PillarAdoptionClient';
import FactServiceClient from './api/FactServiceClient';

export const reportingPlugin = createPlugin({
  id: 'reporting',
  apis: [
    createApiFactory({
      api: pillarAdoptionApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new PillarAdoptionClient({ discoveryApi, identityApi }),
    }),

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

export const PillarAdoptionRatioPage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'PillarAdoptionRatioPage',
    component: () =>
      import('./components/PillarAdoptionRatioComponent').then(
        m => m.PillarAdoptionRatioComponent,
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
