import { scaffolderActionsExtensionPoint, scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import entitySlugToRepoUrl from './scaffolderFilters/entitySlugToRepoUrl';
import entitySlugToRawRepoUrl from './scaffolderFilters/entitySlugToRawRepoUrl';
import entityToRepoUrl from './scaffolderFilters/entityToRepoUrl';

import { buildActions } from './scaffolderActions';
import { getS3Client } from './scaffolderActions/s3';

export const scaffolderCustomActions = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'custom-actions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        templating: scaffolderTemplatingExtensionPoint,
        config: coreServices.rootConfig,
        catalogServiceClient: catalogServiceRef,
      },
      async init({ scaffolder, config, catalogServiceClient, templating }) {
        templating.addTemplateFilters({
          "entitySlugToRepoUrl": entitySlugToRepoUrl,
          "entitySlugToRawRepoUrl": entitySlugToRawRepoUrl,
          "entityToRepoUrl": entityToRepoUrl,
        })
        const scaffolderConfig = config.getConfig("scaffolderActions")
        const opts = {
          catalogApi: catalogServiceClient,
          config: scaffolderConfig,
          getS3Client: getS3Client,
        }
        scaffolder.addActions(...buildActions(opts));
      },
    });
  },
});

