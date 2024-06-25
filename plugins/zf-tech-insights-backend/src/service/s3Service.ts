import {
  ConfigApi,
} from '@backstage/core-plugin-api';
import { GetS3ObjectOptions, ListS3ObjectOptions, ListS3ObjectOutput, S3API, SaveS3ObjectOptions } from 'backstage-plugin-zf-tech-insights-common';
import { GetObjectCommand, PutObjectCommand, S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export type S3ServiceOptions = {
  region?: string;
}

export class S3Service implements S3API {

  private configApi: ConfigApi;
  private s3Client: S3Client;

  constructor(
    configApi: ConfigApi,
    options?: S3ServiceOptions,
  ) {
    this.configApi = configApi;
    const accessKeyId = this.configApi.getOptionalString('aws.accessKeyId');
    const secretAccessKey = this.configApi.getOptionalString(
      'aws.secretAccessKey',
    );
    const region = options?.region ? options.region : this.configApi.getOptionalString('aws.region');
    const sessionToken = this.configApi.getOptionalString('aws.sessionToken');
    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
        region,
      });
    }
    else {
      this.s3Client = new S3Client({ region });
    }
  }

  async listObjects(options: ListS3ObjectOptions): Promise<ListS3ObjectOutput> {
    const command = new ListObjectsV2Command({
      Bucket: options.bucket,
      Prefix: options.prefix,
    })
    const res = await this.s3Client.send(command);
    const objects = res.Contents?.map((object) => { return { key: object.Key ?? "" } }) ?? [];
    return { objects };
  }

  async getObject(options: GetS3ObjectOptions): Promise<string> {
    const args = {
      Bucket: options.bucket,
      Key: options.key,
    };
    const res = await this.s3Client.send(new GetObjectCommand(args));
    // Assuming the S3 object is of type text/plain for simplicity
    const stream = res.Body as Readable;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  async saveObject(options: SaveS3ObjectOptions): Promise<void> {
    const args = {
      Bucket: options.bucket,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      Region: options.region,
    };
    await this.s3Client.send(new PutObjectCommand(args));
  }
}