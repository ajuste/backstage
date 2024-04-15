import {
  createPlugin,
  createApiFactory,
  createApiExtension,
  discoveryApiRef,
} from '@backstage/frontend-plugin-api';
import { convertLegacyRouteRefs } from '@backstage/core-compat-api'
import { rootRouteRef } from './routes';

import {
  GithubResourceFetcherRestApi,
  githubResourceFetcherApiRef,
} from './api';

const zfCatalogAPI = createApiExtension({
  factory: createApiFactory({
    api: githubResourceFetcherApiRef,
    deps: { discoveryApi: discoveryApiRef},
    factory: ({ discoveryApi }) => new GithubResourceFetcherRestApi(discoveryApi),
  }),
});

export default createPlugin({
  id: 'github-resource-fetcher',
  extensions: [zfCatalogAPI],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});