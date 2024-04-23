import {
  createPlugin,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const awsResourceFetcherPlugin = createPlugin({
  id: 'aws-resource-fetcher',
  routes: {
    root: rootRouteRef,
  },
});