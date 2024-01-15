import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from '@internal/plugin-reporting-backend';
import { PluginEnvironment } from '../types';
import { ZFCatalogService } from '@internal/plugin-zf-tech-insights-backend';

export default async function createPlugin(env: PluginEnvironment) {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  const zfCatalogService = new ZFCatalogService(
    env.config,
    catalogClient,
    env.tokenManager,
  );

  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    zfCatalogService,
  });
}
