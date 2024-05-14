import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

import { createRouter } from './router'

export { JiraProxyAPIClient } from './jiraProxy';

export const zfInsightsPlugin = createBackendPlugin({
  pluginId: 'zf-insights',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        catalogServiceClient: catalogServiceRef,
        discovery: coreServices.discovery,
        tokenManager: coreServices.tokenManager,
        http: coreServices.httpRouter,
      },
      async init(options) {
        options.catalogServiceClient
        const router = await createRouter(options)
        options.http.use(router);
      },
    });
  },
});