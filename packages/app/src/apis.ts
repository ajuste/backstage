import {
  createApiExtension,
  ExtensionDefinition,
} from '@backstage/frontend-plugin-api';

import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';

import {
  configApiRef,
  createApiFactory,
  analyticsApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { techRadarApiRef } from '@backstage/plugin-tech-radar';
import { TechRadarClient } from '../src/extensions/TechRadar';
import { githubResourceFetcherApiRef } from '@internal/plugin-github-resource-fetcher';
import { catalogUnprocessedEntitiesPlugin } from '@backstage/plugin-catalog-unprocessed-entities';
import { MatomoAnalytics } from 'plugin-analytics-matomo';

// const catalogUnprocessedEntitiesApi =  useApi(catalogUnprocessedEntitiesApiRef)

export const apis: ExtensionDefinition<any>[] = [
  ...catalogUnprocessedEntitiesPlugin.getApis(),
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: techRadarApiRef,
    deps: {
      githubResourceFetcherApi: githubResourceFetcherApiRef,
    },
    factory: ({ githubResourceFetcherApi }) => {
      return new TechRadarClient(githubResourceFetcherApi);
    },
  }),
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      MatomoAnalytics.fromConfig(configApi, {
        identityApi,
      }),
  }),
].map(factory => createApiExtension({factory}));
