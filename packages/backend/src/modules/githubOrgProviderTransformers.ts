import { loggerToWinstonLogger } from '@backstage/backend-common';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { githubOrgEntityProviderTransformsExtensionPoint } from '@backstage/plugin-catalog-backend-module-github-org';
import { GithubMultiOrgEntityProvider, GithubDiscoveryProcessor, GithubOrgReaderProcessor } from '@backstage/plugin-catalog-backend-module-github';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';

import { transformTream } from '../githubOrganization/githubEntityProvider';
import { GithubProcessor } from '../githubOrganization/githubProcessor';

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'zerofox-org-transformers',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        httpAuth: coreServices.httpAuth,
        tokenManager: coreServices.tokenManager,
        scheduler: coreServices.scheduler,
        githubOrgTransformers:
          githubOrgEntityProviderTransformsExtensionPoint,
      },
      async init({ catalog, config, logger, discovery, tokenManager, scheduler }) {
        if (process.env.NOMAD_ALLOC_INDEX === '0' || !process.env.env ||  process.env.env == 'local' ) {
          const log = loggerToWinstonLogger(logger);
          log.info('Registering Zerofox org Github transformers');

          const transform = async (team: any, ctx: any) => {
            return transformTream(team, ctx, log, discovery);
          }

          log.info('Registering Zerofox org Github processor');
          catalog.addProcessor(new GithubProcessor(config, discovery, tokenManager, log))
          const integrations = ScmIntegrations.fromConfig(config);
          const githubCredentialsProvider =
            DefaultGithubCredentialsProvider.fromIntegrations(integrations);
          catalog.addProcessor(
            GithubDiscoveryProcessor.fromConfig(config, {
              logger: log,
              githubCredentialsProvider,
            }),
            GithubOrgReaderProcessor.fromConfig(config, {
              logger: log,
              githubCredentialsProvider,
            }),
          );
          catalog.addEntityProvider(
            GithubMultiOrgEntityProvider.fromConfig(config, {
              id: 'production',
              githubUrl: 'https://github.com',
              orgs: ['riskive'],
              teamTransformer: transform,
              logger: log,
              schedule: scheduler.createScheduledTaskRunner({
                frequency: { minutes: 15 },
                timeout: { minutes: 15 },
              }),
            }),
          );
        }
      }
    });
  }
});