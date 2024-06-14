import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';
import { S3API } from 'backstage-plugin-zf-tech-insights-common';
import { S3Service } from '@internal/plugin-zf-tech-insights-backend';

/**
 * Returns an S3 client based on the configuration.
 */
export const getS3Client = (config: Config): S3API => {
    return new S3Service(config);
}

const putObject = (opts: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:s3:putObject',
        schema: {
            input: z.object({
                contents: z.any().describe('The content to be JSON serialized and uploaded'),
                bucket: z.string().describe('The S3 bucket to upload the file to (will be prefixed with {env}-'),
                filename: z
                    .string()
                    .describe('The filename of the file that will be created'),
                append_date: z.boolean().optional().default(false).describe('Whether to append the current date to the filename'),
            }),
        },

        async handler(ctx) {
            const client = getS3Client(opts.config);
            let key = ctx.input.filename;
            if (ctx.input.append_date) {
                key = `${key}${new Date().toISOString().slice(0, 10)}`;
            }
            const uploadArgs = {
                bucket: `${opts.config.getOptionalString('env')}-${ctx.input.bucket}`,
                key: key,
                body: JSON.stringify(ctx.input.contents),
            };
            await client.saveObject(uploadArgs);
        },
    });
};

export default { putObject }