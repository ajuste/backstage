import { createRouter } from '@internal/plugin-github-resource-fetcher-backend';
import { PluginEnvironment } from '../types';

export default async function createPlugin(env: PluginEnvironment) {
  return await createRouter({
    config: env.config,
    logger: env.logger,
  });
}
