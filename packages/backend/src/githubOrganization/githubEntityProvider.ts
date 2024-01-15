
import { defaultOrganizationTeamTransformer, GithubOrgEntityProviderOptions } from '@backstage/plugin-catalog-backend-module-github';
import { PluginEnvironment } from '../types';


export const buildEntityProviderOptions = (env: PluginEnvironment): GithubOrgEntityProviderOptions => {
    return {
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

                    if (!entity.metadata.tags) {
                        entity.metadata.tags = [];
                    }
                    if (!entity.metadata.tags.includes('scrum-team')) {
                        entity.metadata.tags.push('scrum-team')
                    }
                    if (!entity.metadata.annotations) {
                        entity.metadata.annotations = {};
                    }
                    entity.metadata.annotations['zerofox.com/pillar'] = 'Protection'
                }
            }
            if (entity?.metadata?.name?.includes('pillar-')) {
                if (entity.spec !== null && entity.spec !== undefined) {
                    Object.assign(entity.spec, { 'type': 'pillar' });
                }
            }
            return entity;
        },
    }
}