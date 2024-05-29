import {
  createRouter,
  createDefaultBadgeFactories,
  } from '@backstage-community/plugin-badges-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';


export const createMyCustomBadgeFactories = (): BadgeFactories => ({
    service_owner: {
        createBadge: (context: BadgeContext): Badge => {
          console.log(context);
          // we can create labels
            // ...
            return {
                label: 'my-badge',
                message: 'custom stuff',
                // ...
            };
        },
    },
    // also the default labels include all the metadata on the spec object,
    // for example
    // spec: { type: 'library', owner: 'CNCF', lifecycle: 'experimental' },
    ...createDefaultBadgeFactories(),
});

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    config: env.config,
    discovery: env.discovery,
    badgeFactories: createMyCustomBadgeFactories(),
    tokenManager: env.tokenManager,
    logger: env.logger,
    identity: env.identity,
  });
}