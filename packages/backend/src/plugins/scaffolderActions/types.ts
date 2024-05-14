import { CatalogApi } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import { _Object, S3Client } from '@aws-sdk/client-s3';
import { TemplateAction } from '@backstage/plugin-scaffolder-node';

/**
 * Returns an S3 client based on the configuration.
 * @param config The configuration
 * @returns The S3 client
 */
export type S3ClientGetter = (config: Config) => S3Client;

/**
 * Options for creating a scaffolder action
 * @param catalogApi The catalog API
 * @param config The configuration
 * @param getS3Client The S3 client getter
 */
export type ScaffolderActionFactoryOptions = {
    catalogApi: CatalogApi;
    config: Config;
    getS3Client: S3ClientGetter;
}

/**
 * Create a scaffolder action
 * @param opts The options
 * @returns The template action
 */
export type ScaffolderActionFactory = (opts: ScaffolderActionFactoryOptions) => TemplateAction;