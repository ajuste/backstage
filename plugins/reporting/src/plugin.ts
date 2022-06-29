import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef, codeCoverageRouteRef } from './routes';

export const reportingPlugin = createPlugin({
  id: 'reporting',
  routes: {
    root: rootRouteRef,
    codeCoverage: codeCoverageRouteRef,
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
    name: 'CodeCoveragePage',
    component: () =>
      import('./components/CodeCoverageReportComponent').then(m => m.CodeCoverageReportComponent),
    mountPoint: rootRouteRef,
  }),
);
