import {
    createPlugin,
    createApiExtension,
    createApiFactory,
} from '@backstage/frontend-plugin-api';

import {
    configApiRef,
    identityApiRef,
    fetchApiRef,
    discoveryApiRef,
} from '@backstage/core-plugin-api';
import { ragAiApiRef, RoadieRagAiClient } from '@roadiehq/rag-ai';
export { RagModal, SidebarRagModal } from '@roadiehq/rag-ai';

const ragAIApiFactory = createApiFactory({
    api: ragAiApiRef,
    deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
    },
    factory: ({ discoveryApi, fetchApi, configApi, identityApi }) => {
        return new RoadieRagAiClient({
            discoveryApi,
            fetchApi,
            configApi,
            identityApi,
        });
    },
});

const apiExtension = createApiExtension({
    factory: ragAIApiFactory,
});

export default createPlugin({
    id: 'ai',
    extensions: [apiExtension],
});

