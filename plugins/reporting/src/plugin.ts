import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef, codeCoverageRouteRef, serviceStalenessRouteRef } from './routes';

export const reportingPlugin = createPlugin({
  id: 'reporting',
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
      import('./components/CodeCoverageReportComponent').then(m => m.CodeCoverageReportComponent),
    mountPoint: rootRouteRef,
  }),
);

export const StalenessPage = reportingPlugin.provide(
  createRoutableExtension({
    name: 'ComponentStalenessPage',
    component: () =>
      import('./components/ComponentStalenessReportComponent').then(m => m.ComponentStalenessReportComponent),
    mountPoint: rootRouteRef,
  }),
);
