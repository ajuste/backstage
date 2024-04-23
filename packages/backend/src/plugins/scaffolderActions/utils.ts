import { CatalogApi } from '@backstage/catalog-client';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';


export const randomBranchName = () => {
    return createTemplateAction({
        id: 'zf:util:randomBranchName',
        schema: {
            input: z.object({}),
            output: z.object({
                branchName: z.string()
            }),
        },

        async handler(ctx) {
            ctx.output("branchName", `feature/${Math.random().toString(36).substring(7)}`);
        },
    });
};

export const getEntity = (catalogApi: CatalogApi) => {
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
            const entity = await catalogApi.getEntityByRef(ref);
            ctx.output("entity", entity);
        },
    });
};