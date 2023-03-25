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
import { pillarAdoptionApiRef } from './api/api';
import PillarAdoptionClient from './api/PillarAdoptionClient';

export const reportingPlugin = createPlugin({
  id: 'reporting',
  apis: [
    createApiFactory({
      api: pillarAdoptionApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new PillarAdoptionClient({ discoveryApi, identityApi }),
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
