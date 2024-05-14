import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';

/**
 * Returns an S3 client based on the configuration.
 */
export const getS3Client = (config: Config): S3Client => {
    const accessKeyId = config.getOptionalString('aws.accessKeyId');
    const secretAccessKey = config.getOptionalString(
        'aws.secretAccessKey',
    );
    const region = config.getOptionalString('aws.region');
    const sessionToken = config.getOptionalString('aws.sessionToken');
    if (accessKeyId && secretAccessKey) {
        return new S3Client({
            credentials: {
                accessKeyId,
                secretAccessKey,
                sessionToken,
            },
            region,
        });
    }
    return new S3Client({ region });
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
                Bucket: `${opts.config.getOptionalString('env')}-${ctx.input.bucket}`,
                Key: key,
                Body: JSON.stringify(ctx.input.contents),
            };
            await client.send(new PutObjectCommand(uploadArgs));
        },
    });
};

export default { putObject }