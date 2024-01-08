import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { GithubProcessor } from '../processors/githubProcessor';
import { GithubOrgEntityProvider, defaultOrganizationTeamTransformer } from '@backstage/plugin-catalog-backend-module-github';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';


export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new GithubProcessor(env.config.config.data.integrations.github[0].token));


  // Fetches all users and teams from the riskive org
  builder.addEntityProvider(
    GithubOrgEntityProvider.fromConfig(env.config, {
      id: 'production',
      orgUrl: 'https://github.com/riskive',
      logger: env.logger,
      schedule: env.scheduler.createScheduledTaskRunner({
        frequency: { minutes: 1 },
        timeout: { minutes: 15 },
      }),
      teamTransformer: async (team, ctx) => {
        const entity = await defaultOrganizationTeamTransformer(team, ctx);
        if (entity?.metadata?.name?.includes('team-')) {
          if (entity.spec !== null && entity.spec !== undefined) {
            Object.assign(entity.spec, { 'type': 'team' });
            Object.assign(entity.metadata.annotations, { 'zerofox.com/pillar': 'Protection' });
          }
        }
        if (entity?.metadata?.name?.includes('pillar-')) {
          if (entity.spec !== null && entity.spec !== undefined) {
            Object.assign(entity.spec, { 'type': 'pillar' });
          }
        }

        // TODO assign other metadata fields
        // Here is an example of how to do this
        // Object.assign(entity.metadata.annotations, { 'zerofox.com/pillar': 'Pillar Name' });
        return entity;
      },
    }),
  );

  // TODO add later
  // Fetches all repos and uploads to Backstage automatically
  builder.addEntityProvider(
    GithubEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler,
      // TODO maybe add transformer here for defining owners by fetching maintaining teams
    }),
  );

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  builder.setProcessingIntervalSeconds(7200); // every 2 hours
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
