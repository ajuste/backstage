import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';

import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  analyticsApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { techRadarApiRef } from '@backstage/plugin-tech-radar';
import { TechRadarClient } from './lib/TechRadarClient';
import { githubResourceFetcherApiRef } from '@internal/plugin-github-resource-fetcher';
import { GoogleAnalytics } from '@backstage/plugin-analytics-module-ga';

export const apis: AnyApiFactory[] = [
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
  //Instantiate and register the GA Analytics API Implementation.
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      GoogleAnalytics.fromConfig(configApi, {
        identityApi,
      }),
  }),
];
