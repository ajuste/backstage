import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { GithubOrgEntityProvider, defaultOrganizationTeamTransformer } from '@backstage/plugin-catalog-backend-module-github';
import { GithubProcessor } from '../processors/githubProcessor';
import { GithubOrgEntityProvider, defaultOrganizationTeamTransformer } from '@backstage/plugin-catalog-backend-module-github';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { Octokit } from "octokit";


export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new GithubProcessor());

  // Fetches all users and teams from the riskive org
  builder.addEntityProvider(
    GithubOrgEntityProvider.fromConfig(env.config, {
      id: 'production',
      orgUrl: 'https://github.com/riskive',
      logger: env.logger,
      schedule: env.scheduler.createScheduledTaskRunner({
        frequency: { minutes: 60 },
        timeout: { minutes: 15 },
      }),
      teamTransformer: async (team, ctx) => {
        const entity = await defaultOrganizationTeamTransformer(team, ctx);
        console.log(entity);
        if (entity?.metadata?.name?.includes('team-')) {
          if (entity.spec !== null && entity.spec !== undefined) {
            Object.assign(entity.spec, { 'type': 'team' });
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
  // builder.addEntityProvider(
  //   GithubEntityProvider.fromConfig(env.config, {
  //     logger: env.logger,
  //     scheduler: env.scheduler,
  //     // TODO maybe add transformer here for defining owners by fetching maintaining teams
  //   }),
  // );

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  builder.setProcessingIntervalSeconds(7200); // every 2 hours
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
