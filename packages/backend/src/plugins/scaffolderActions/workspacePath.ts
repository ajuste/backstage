import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';

const workspacePath = () => {

    return createTemplateAction({
        id: 'zf:workspacePath',
        schema: {
            input: z.object({}),
            output: z.object({
                path: z.string()
            }),
        },
        async handler(ctx) {
            ctx.output("path", ctx.workspacePath);
        },
    });
};

export default { workspacePath }