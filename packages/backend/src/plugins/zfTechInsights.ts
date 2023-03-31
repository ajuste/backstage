import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from '@internal/plugin-zf-tech-insights-backend';
import { PluginEnvironment } from '../types';

export default async function createPlugin(env: PluginEnvironment) {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });
  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    catalogClient,
  });
}
