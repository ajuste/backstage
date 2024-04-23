import { Config } from '@backstage/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * Returns an S3 client based on the configuration.
 * @param config - The configuration object.
 * @returns An instance of the S3Client.
 */
const getS3Client = (config: Config): S3Client => {
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

/**
 * Options for the getObject function.
 */
export type GetObjectOptions = {
  config: Config;
  bucket: string;
  key: string;
}

/**
 * Retrieves an object from an S3 bucket.
 * @param options - The options for retrieving the object.
 * @returns A promise that resolves to the retrieved object.
 */
export const getS3Object = async (options: GetObjectOptions) => {
  const client = getS3Client(options.config);
  const args = {
    Bucket: options.bucket,
    Key: options.key,
  };
  const res = await client.send(new GetObjectCommand(args));
  // Assuming the S3 object is of type text/plain for simplicity
  const stream = res.Body as Readable;
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}
