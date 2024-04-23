import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';

import { getS3Object } from './s3';

/**
* RouterOptions
*
* @public
*/
export interface RouterOptions {
  logger: Logger;
  config: Config;
}

/**
* A method to create a router for the the plugin
* @public
*/
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json({ limit: '10MB' }));

  const {
    logger: parentLogger,
  } = options;

  const logger = parentLogger.child({ plugin: 'aws-resource-fetcher' });

  router
    .get(
      '/s3/:bucketName/*',
      async (req, res) => {

        const objectKey = req.path.replace(`/s3/${req.params.bucketName}/`, '');
        logger.info(`Fetching object from S3 bucket ${req.params.bucketName} with key ${objectKey}`);
        const objectBody = await getS3Object({
          config: options.config,
          bucket: req.params.bucketName,
          key: objectKey,
        });

        res.send(objectBody);
      },
    )

  const app = express();
  app.set('logger', logger);
  app.use('/', router);

  return app;
}