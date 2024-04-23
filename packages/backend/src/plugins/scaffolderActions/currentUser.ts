import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';


export const getCurrentUser = () => {
    return createTemplateAction({
        id: 'zf:user:get',
        schema: {
            input: z.object({}),
            output: z.object({
                ref: z.string().describe('The reference of the current user'),
                entityName: z.string().describe('The entity name'),
                displayName: z.string().describe('The user name'),
            }),
        },

        async handler(ctx) {
            ctx.output("ref", ctx.user?.ref ? ctx.user.ref : 'guest')
            ctx.output("entityName", ctx.user?.entity?.metadata.name ? ctx.user?.entity?.metadata.name : 'guest')
            ctx.output("displayName", ctx.user?.entity?.spec.profile?.displayName ? ctx.user?.entity?.spec.profile?.displayName : 'guest')

        },
    });
};