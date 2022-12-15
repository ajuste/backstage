import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
} from '@backstage/core-plugin-api';

import {
  GithubResourceFetcherRestApi,
  githubResourceFetcherApiRef,
} from './api';

import { rootRouteRef } from './routes';

export const githubResourceFetcherPlugin = createPlugin({
  id: 'github-resource-fetcher',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: githubResourceFetcherApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory: ({ discoveryApi }) =>
        new GithubResourceFetcherRestApi(discoveryApi),
    }),
  ],
});

export const GithubResourceFetcherPage = githubResourceFetcherPlugin.provide(
  createRoutableExtension({
    name: 'GithubResourceFetcherPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
