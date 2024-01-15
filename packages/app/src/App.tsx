import React from 'react';
import { Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';

import {
  CatalogIndexPage,
  CatalogEntityPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { PillarAwareCatalogPage } from './components/catalog/PillarAwareCatalogPage'
import { Root } from './components/Root';


import { AlertDisplay, OAuthRequestDialog, SignInPage, IdentityProviders } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { HomePage } from './components/home/HomePage';
import { ReportingPage, CodeCoveragePage, StalenessPage, PillarAdoptionRatioPage, EntitiesFactsPage } from 'plugin-reporting';
import { ExplorePage } from './components/explore/ExplorePage';
import { oktaAuthApiRef, configApiRef, useApi, githubAuthApiRef } from '@backstage/core-plugin-api';


import * as plugins from './plugins';

const GuestDisabledEnvs = ['qa', 'stag', 'prod'];

const app = createApp({
  apis,
  plugins: Object.values(plugins),
  components: {
    SignInPage: props => {
      const configApi = useApi(configApiRef);
      let providers: IdentityProviders = !GuestDisabledEnvs.includes(configApi.getOptionalString('auth.environment') || "") ? ['guest'] : []
      providers = [...providers,
      {
        id: 'okta-auth-provider',
        title: 'Okta',
        message: 'Sign in using Okta',
        apiRef: oktaAuthApiRef,
      }, {
        id: 'github-auth-provider',
        title: 'GitHub',
        message: 'Sign in using GitHub',
        apiRef: githubAuthApiRef,
      }];
      return (
        <SignInPage {...props} providers={providers} />);

    },
  },
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<HomePage />} />
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
    <Route path="/docs" element={<TechDocsIndexPage initialFilter='all' />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radars/ui-e"
      element={
        <TechRadarPage
          id="ui-e"
          width={1500}
          height={800}
          title="UI - East"
          subtitle="Use this radar to determine recommended technologies for new and existing frontend projects."
          pageTitle="UI-East"
        />
      }
    />
    <Route
      path="/tech-radars/ui-w"
      element={
        <TechRadarPage
          id="ui-w"
          width={1500}
          height={800}
          title="UI - West"
          subtitle="Use this radar to determine recommended technologies for new and existing frontend projects."
          pageTitle="UI-West"
        />
      }
    />
    <Route
      path="/tech-radars/qa"
      element={
        <TechRadarPage
          id="qa"
          width={1500}
          height={800}
          title="Testing & Quality"
          subtitle="Use this radar to determine recommended technologies for testing and quality purposes."
          pageTitle="QA"
        />
      }
    />
    <Route
      path="/tech-radars/sre"
      element={
        <TechRadarPage
          id="sre"
          width={1500}
          height={800}
          title="Site Reliability & Efficiency"
          subtitle="Use this radar to determine recommended technologies for new and existing infrastructure projects."
          pageTitle="SRE"
        />
      }
    />
    <Route
      path="/tech-radars/python"
      element={
        <TechRadarPage
          id="python"
          width={1500}
          height={800}
          title="Python"
          subtitle="Use this radar to determine recommended technologies for new and existing Python projects."
          pageTitle="Python"
        />
      }
    />
    <Route
      path="/tech-radars/ai"
      element={
        <TechRadarPage
          id="ai"
          width={1500}
          height={800}
          title="AI & Analysis"
          subtitle="Use this radar to determine recommended technologies for new and existing AI projects."
          pageTitle="AI & Analysis"
        />
      }
    />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/reporting" element={<ReportingPage />} />
    <Route path="/reporting/code-coverage" element={<CodeCoveragePage />} />
    <Route path="/reporting/service-staleness" element={<StalenessPage />} />
    <Route path="/reporting/pillar-adoption-ratio" element={<PillarAdoptionRatioPage />} />
    <Route path="/reporting/entities-fact" element={<EntitiesFactsPage />} />
    <Route path="/explore" element={<ExplorePage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>
);
