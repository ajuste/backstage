// src/plugin.ts
import {
  createBackendPlugin,
  coreServices,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service';
import { loggerToWinstonLogger } from '@backstage/backend-common';

export const awsResourceFetcherPlugin = createBackendPlugin({
  pluginId: 'aws-resource-fetcher',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
      },
      async init({
        logger: log,
        httpRouter,
        config: rootConfig,
      }) {
        const logger = loggerToWinstonLogger(log);
        const config = rootConfig.getConfig('awsResourceFetcher');
        const router = await createRouter({ logger, config });
        
        logger.info('Initializing AWS Resource Fetcher plugin');
        
        httpRouter.use(router);
      },
    });
  },
});
