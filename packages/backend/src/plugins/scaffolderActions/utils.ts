import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';


const randomBranchName = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:util:randomBranchName',
        schema: {
            input: z.object({}),
            output: z.object({
                branchName: z.string()
            }),
        },

        async handler(ctx) {
            ctx.output("branchName", `feature-${Math.random().toString(36).substring(7)}`);
        },
    });
};

const getEntity = (opts: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:entity:get',
        schema: {
            input: z.object({
                entityRef: z.string()
            }),
            output: z.object({
                entity: z.any()
            }),
        },

        async handler(ctx) {
            const ref = ctx.input.entityRef;
            const entity = await opts.catalogApi.getEntityByRef(ref);
            ctx.output("entity", entity);
        },
    });
};

const generatePullRequestTextsForLibraryOnboarding = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:libraryOnBoarding',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the library onboarding process, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Library onboarding.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const generatePullRequestTextsForGenericOnBoarding = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:genericOnBoarding',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the generic onboarding process, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Generic repository onboarding.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const generatePullRequestTextsForNomadServiceOnboarding = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:nomadServiceOnBoarding',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the Nomad service onboarding process, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Nomad service onboarding.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const generatePullRequestTextsForStandardDocumentationGeneration = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:generateStandardDocs',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the standard documentation generation, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Standard documentation generation.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const ifAction = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:utils:if',
        schema: {
            input: z.object({
                condition: z.any(),
                returnOnTrue: z.any(),
                returnOnFalse: z.any(),
            }),
            output: z.object({
                return: z.any(),
            }),
        },

        async handler(ctx) {
            ctx.output("return", ctx.input.condition ? ctx.input.returnOnTrue : ctx.input.returnOnFalse);
        },
    });
};


const getSetting = (opts: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:util:getSetting',
        schema: {
            input: z.object({
                key: z.string(),
            }),
            output: z.object({
                setting: z.any(),
            }),
        },

        async handler(ctx) {
            debugger
            ctx.output("setting", opts.config.get(ctx.input.key));
        },
    });
};

export default {
    randomBranchName,
    getEntity,
    generatePullRequestTextsForLibraryOnboarding,
    generatePullRequestTextsForNomadServiceOnboarding,
    generatePullRequestTextsForStandardDocumentationGeneration,
    generatePullRequestTextsForGenericOnBoarding,
    ifAction,
    getSetting,
}