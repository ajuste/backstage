import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { ScaffolderActionFactoryOptions } from './types';

const createTempFolder = (_: ScaffolderActionFactoryOptions) => {

    return createTemplateAction({
        id: 'zf:fs:mkTempFolder',
        schema: {
            input: z.object({}),
            output: z.object({
                path: z.string().describe('The path to the created folder'),
            }),
        },
        async handler(ctx) {
            const path = await mkdtemp(tmpdir());
            ctx.output("path", path);
        },
    });
};

export default { createTempFolder }