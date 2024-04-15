import React from 'react';
import { Route } from 'react-router-dom';

import orgPlugin from '@backstage/plugin-org/alpha';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { TechDocsReaderPage, TechDocsIndexPage } from '@backstage/plugin-techdocs';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { ApiExplorerPage } from '@backstage/plugin-api-docs';
import { CatalogUnprocessedEntitiesPage } from '@backstage/plugin-catalog-unprocessed-entities';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import { createApp } from '@backstage/frontend-app-api';
import { createExtensionOverrides } from '@backstage/frontend-plugin-api';
import { FlatRoutes } from '@backstage/core-app-api';
import { CatalogEntityPage, CatalogIndexPage, } from '@backstage/plugin-catalog';
import catalogImportPlugin from '@backstage/plugin-catalog-import/alpha';
import zfTechInsightsPlugin from 'backstage-plugin-zf-tech-insights/alpha';
import reportingPlugin from 'plugin-reporting/alpha';
import githubResourceFetcherPlugin from '@internal/plugin-github-resource-fetcher/alpha';
import grafanaPlugin from 'plugin-grafana/alpha';
import { QetaPage } from '@drodil/backstage-plugin-qeta';
import { apis } from './apis';
import { convertLegacyApp } from '@backstage/core-compat-api'
import { AppNav } from './extensions/AppNav';
import { SigninPage } from './extensions/SignInPage';
import { techRadarExtensionOverride } from './extensions/TechRadar';
import { entityPage } from './components/catalog/EntityPage';
import { PillarAwareCatalogPage } from './components/catalog/PillarAwareCatalogPage';
import homePlugin, { HomeNavIcon, homePageExtension } from './extensions/Home';

const routes = (
  <FlatRoutes>
    <Route
      path="/catalog"
      element={<CatalogIndexPage initialKind="system" />}
    >
      <PillarAwareCatalogPage />
    </Route>
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/docs" element={<TechDocsIndexPage initialFilter='all' />} />
    <Route
      path="/docs/:namespace/:kind/:name"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route path="/qeta" element={<QetaPage title="Questions" />} />
    <Route path="/catalog-unprocessed-entities" element={<CatalogUnprocessedEntitiesPage />}
    />
  </FlatRoutes>
);

const legacyFeatures = convertLegacyApp(routes);
const app = createApp({
  features: [
    orgPlugin,
    zfTechInsightsPlugin,
    githubResourceFetcherPlugin,
    grafanaPlugin,
    homePlugin,
    catalogImportPlugin,
    techRadarExtensionOverride,
    reportingPlugin,
    ...legacyFeatures,
    createExtensionOverrides({
      extensions: [
        HomeNavIcon,
        AppNav,
        homePageExtension,
        SigninPage,
        ...apis
      ],
    }),
  ],
  bindRoutes({ bind }) {
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
  }
});

export default app.createRoot();