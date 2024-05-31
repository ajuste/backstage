import {
  createPlugin,
  createApiFactory,
  createApiExtension,
  createPageExtension,
} from '@backstage/frontend-plugin-api';
import {
  compatWrapper,
  convertLegacyRouteRef,
} from '@backstage/core-compat-api';
import { techInsightsApiRef } from '@backstage-community/plugin-tech-insights';
import { convertLegacyRouteRefs } from '@backstage/core-compat-api'
import { rootRouteRef, codeCoverageRouteRef, serviceStalenessRouteRef, entitiesFactRouteRef, entitiesCheckRouteRef } from './routes';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { factAiRef } from './api/api';
import FactServiceClient from './api/FactServiceClient';
import { CatalogComponent } from './components/CatalogComponent';
import { CodeCoverageReportComponent } from './components/CodeCoverageReportComponent';
import { ComponentStalenessReportComponent } from './components/ComponentStalenessReportComponent';
import { EntitiesFactReportComponent } from './components/EntitiesFactReportComponent';
import { EntitiesChecksReportComponent } from './components/EntitiesChecksReportComponent';

const apiExtension = createApiExtension({
  factory: createApiFactory({
    api: factAiRef,
    deps: { catalogApi: catalogApiRef, techInsightsApi: techInsightsApiRef },
    factory: ({ catalogApi, techInsightsApi }) => new FactServiceClient(catalogApi, techInsightsApi),
  }),
});

export const reportingPageExtension = createPageExtension({
  defaultPath: '/reporting',
  name: 'Catalog',
  namespace: 'code-coverage',
  routeRef: convertLegacyRouteRef(rootRouteRef),
  loader: () => Promise.resolve(compatWrapper(CatalogComponent())),
});

export const codeCoveragePageExtension = createPageExtension({
  defaultPath: '/reporting/code-coverage',
  name: 'CodeCoverage',
  namespace: 'code-coverage',
  routeRef: convertLegacyRouteRef(codeCoverageRouteRef),
  loader: () => Promise.resolve(compatWrapper(CodeCoverageReportComponent())),
});

export const componentStalenessPageExtension = createPageExtension({
  defaultPath: '/reporting/service-staleness',
  name: 'ComponentStalenessPage',
  namespace: 'code-coverage',
  routeRef: convertLegacyRouteRef(serviceStalenessRouteRef),
  loader: () => Promise.resolve(compatWrapper(ComponentStalenessReportComponent())),
});

export const componentEntitiesFactPageExtension = createPageExtension({
  defaultPath: '/reporting/entities-fact',
  name: 'ComponentEntitiesFactPage',
  namespace: 'code-coverage',
  routeRef: convertLegacyRouteRef(entitiesFactRouteRef),
  loader: () => Promise.resolve(compatWrapper(EntitiesFactReportComponent())),
});

export const componentEntitiesCheckPageExtension = createPageExtension({
  defaultPath: '/reporting/entities-checks',
  name: 'ComponentEntitiesCheckPage',
  namespace: 'code-coverage',
  routeRef: convertLegacyRouteRef(entitiesCheckRouteRef),
  loader: () => Promise.resolve(compatWrapper(EntitiesChecksReportComponent())),
});

export default createPlugin({
  id: 'reporting',
  extensions: [apiExtension, reportingPageExtension, codeCoveragePageExtension, componentStalenessPageExtension, componentEntitiesFactPageExtension, componentEntitiesCheckPageExtension],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});
