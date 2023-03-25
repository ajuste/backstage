import { createRouter } from '@internal/plugin-reporting-backend';
import { PluginEnvironment } from '../types';

export default async function createPlugin(env: PluginEnvironment) {
  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
  });
}
