
import {
    createApiExtension,
    createApiFactory,
    createPlugin,
    discoveryApiRef,
} from '@backstage/frontend-plugin-api';
import {
    convertLegacyRouteRefs,
} from '@backstage/core-compat-api';
import {
    rootRouteRef,
} from './routes';

import { awsResourceFetcherApiRef, AWSResourceFetcherRestAPI } from './api';

const awsResourceFetcherApi = createApiExtension({
    factory: createApiFactory({
        api: awsResourceFetcherApiRef,
        deps: {
            discoveryApi: discoveryApiRef,
        },
        factory: ({ discoveryApi }) =>
            new AWSResourceFetcherRestAPI(
                discoveryApi,
            ),
    }),
});

export const awsResourceFetcherPlugin = createPlugin({
    id: 'aws-resource-fetcher',
    routes: convertLegacyRouteRefs({
        root: rootRouteRef,
    }),
});

export default createPlugin({
    id: 'aws-resource-fetcher',
    routes: convertLegacyRouteRefs({
        root: rootRouteRef,
    }),
    extensions: [awsResourceFetcherApi],
});