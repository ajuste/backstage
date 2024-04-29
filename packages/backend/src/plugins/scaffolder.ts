import { scaffolderActionsExtensionPoint, scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { putObject, getS3Client } from './scaffolderActions/s3';
import { generateAllEntry, generateScore } from './scaffolderActions/serviceAssessment';
import { getCurrentUser } from './scaffolderActions/currentUser';
import { commandRunner } from './scaffolderActions/commandRunner';
import { createTempFolder } from './scaffolderActions/fs';
import { workspacePath } from './scaffolderActions/workspacePath';
import { randomBranchName, getEntity } from './scaffolderActions/utils';
import entitySlugToRepoUrl from './scaffolderFilters/entitySlugToRepoUrl';
import entitySlugToRawRepoUrl from './scaffolderFilters/entitySlugToRawRepoUrl';

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
        })
        const scaffolderConfig = config.getConfig("scaffolderActions")
        scaffolder.addActions(putObject(scaffolderConfig));
        scaffolder.addActions(generateScore(), generateAllEntry(getS3Client, scaffolderConfig));
        scaffolder.addActions(getCurrentUser());
        scaffolder.addActions(commandRunner());
        scaffolder.addActions(createTempFolder());
        scaffolder.addActions(workspacePath());
        scaffolder.addActions(randomBranchName());
        scaffolder.addActions(getEntity(catalogServiceClient));

      },
    });
  },
});

