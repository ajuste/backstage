import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';
import { JiraProxyAPIClient } from '@internal/plugin-zf-tech-insights-backend';

const addNewIssue = (opts: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:jira:addNewIssue',
        schema: {
            input: z.object({
                projectKey: z.string().describe('The project key'),
                summary: z.string().describe('The summary of the issue'),
                description: z.string().describe('The description of the issue'),
                issueType: z.number().describe('The issue type ID'),
                fields: z.any().optional().describe('Extra field for the issue'),
            }),
            output: z.object({
                id: z.string(),
                key: z.string(),
                url: z.string(),
            }),
        },

        async handler(ctx) {

            const client = new JiraProxyAPIClient(opts.config)
            const fields = ctx.input.fields ? ctx.input.fields : {};
            const issue = await client.addNewIssue({
                fields: {
                    project: {
                        key: ctx.input.projectKey,
                    },
                    summary: ctx.input.summary,
                    description: ctx.input.description,
                    issuetype: {
                        id: ctx.input.issueType,
                    },
                    ...fields,
                },
            });

            ctx.output('id', issue.id);
            ctx.output('key', issue.key);
            ctx.output('url', `https://${opts.config.getString('jira.addr')}/browse/${issue.key}`);
        }
    });
}

export default { addNewIssue }