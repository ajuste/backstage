import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { GithubOrgEntityProvider, defaultOrganizationTeamTransformer } from '@backstage/plugin-catalog-backend-module-github';


export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

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

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  builder.setProcessingIntervalSeconds(7200); // every 2 hours
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
