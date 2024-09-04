import express from 'express';
import Router from 'express-promise-router';
import { errorHandler } from '@backstage/backend-common';
import { PluginEndpointDiscovery } from '@backstage/backend-common';
import { ConfigApi, } from '@backstage/core-plugin-api';
import { TokenManager } from '@backstage/backend-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';

import ZFCatalogService from './catalog';
import NomadProxyAPIClient from './nomadProxy';
import { JiraProxyAPIClient } from './jiraProxy';
import { S3Service } from './s3Service';
import { RDSService } from './rds';


export interface RouterOptions {
  logger: LoggerService;
  config: ConfigApi;
  discovery: PluginEndpointDiscovery;
  tokenManager: TokenManager;
  catalogServiceClient: CatalogApi;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {

  const { logger } = options;

  const router = Router();
  router.use(express.json());

  const buildCatalogServiceRouter = (): ZFCatalogService => {
    return new ZFCatalogService(
      options.catalogServiceClient,
      options.tokenManager,
    );
  };

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/entities/standalone', (_, response) => {
    logger.info(`Fetching standaalone entities`);
    const service = buildCatalogServiceRouter();
    service
      .getStandaloneEntities()
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  router.get('/pillar', (_, response) => {
    logger.info(`Fetching all pillar components`);
    const service = buildCatalogServiceRouter();
    service
      .getPillars()
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  router.get('/pillar/:pillar', (request, response) => {
    logger.info(`Fetching pillar ${request.params.pillar}`);
    const pillar = request.params.pillar;
    const service = buildCatalogServiceRouter();
    service
      .getPillar(pillar)
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  router.get('/pillar/:pillar/teams', (request, response) => {
    logger.info(`Fetching teams for pillar ${request.params.pillar}`);
    const pillar = request.params.pillar;
    const service = buildCatalogServiceRouter();
    service
      .getTeamsForPillar(pillar)
      .then(res => {
        logger.info(`Fetching teams for pillar2 ${res}`);
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  // Nomad routes
  router.get('/nomad/jobs', (request, response) => {
    logger.info(`Listing jobs`);
    const service = new NomadProxyAPIClient(options.config)
    const filter = request.query.filter as string;
    const requestOptions = { filter };
    service
      .getJobs(requestOptions)
      .then(res => {
        response.send(res);
        response.end();
      }
      ).catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  // JIRA routes
  router.put('/jira/jobs', (request, response) => {
    const body = JSON.parse(request.body);

    logger.info(`Creating JIRA issue ${JSON.stringify(request.body)}`);

    const service = new JiraProxyAPIClient(options.config)
    service
      .addNewIssue(body)
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  router.post('/jira/jobs/:issueId', (request, response) => {
    const body = JSON.parse(request.body);
    const issueId = request.params.issueId;

    logger.info(`Updating JIRA issue ${issueId} and payload ${JSON.stringify(request.body)}`);

    const { issueUpdate, query } = body;

    if (!issueUpdate) {
      response.status(400).json({ error: 'issueUpdate is required' });
      return;
    }

    const service = new JiraProxyAPIClient(options.config)
    service
      .updateIssue(issueId, issueUpdate, query)
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  router.get('/jira/search', (request, response) => {
    const searchString = request.query.searchString as string;
    const startAt = request.query.startAt as number | undefined;
    const maxResults = request.query.maxResults as number | undefined;
    const fields = request.query.fields as string[] | undefined;
    const expand = request.query.expand as string[] | undefined;

    logger.info(`Searching JIRA for ${searchString} with startAt ${startAt}, maxResults ${maxResults}, fields ${fields} and expand ${expand}`);

    const optional = startAt || maxResults || fields || expand ? { startAt, maxResults, fields, expand } : undefined;
    const service = new JiraProxyAPIClient(options.config)
    service
      .searchJira(searchString, optional)
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  // S3 API
  router
    .get(
      '/s3/:bucketName/*',
      async (req, res) => {

        const service = new S3Service(options.config);
        const objectKey = req.path.replace(`/s3/${req.params.bucketName}/`, '');
        logger.info(`Fetching object from S3 bucket ${req.params.bucketName} with key ${objectKey}`);
        const objectBody = await service.getObject({
          bucket: req.params.bucketName,
          key: objectKey,
        });

        res.send(objectBody);
      },
    )

  router
    .put(
      '/s3/:bucketName/*',
      async (req, res) => {

        const objectKey = req.path.replace(`/s3/${req.params.bucketName}/`, '');
        logger.info(`Saving object to S3 bucket ${req.params.bucketName} with key ${objectKey}`);

        const body = JSON.parse(req.body);
        if (!body) {
          res.status(400).json({ error: 'body is required' });
          return;
        }
        if (typeof body !== 'string') {
          res.status(400).json({ error: 'body must be a string' });
          return;
        }
        const service = new S3Service(options.config);
        await service.saveObject({
          bucket: req.params.bucketName,
          key: objectKey,
          body: body,
          contentType: req.get('X-Content-Type'),
          region: req.get('X-Region'),
        });

        res.status(200).end();
      },
    )
  router
    .get(
      '/s3/list/:bucketName/',
      async (req, res) => {

        const service = new S3Service(options.config);
        const prefix = req.path.replace(`/s3/${req.params.bucketName}/`, '');
        logger.info(`Listing objects from S3 bucket ${req.params.bucketName} with prefix ${prefix}`);
        const objects = await service.listObjects({
          bucket: req.params.bucketName,
          prefix,
        });

        res.send(objects);
      },
    )

  // RDS API
  router
    .get(
      '/rds/:instance/',
      async (req, res) => {

        const service = new RDSService(options.config, options.catalogServiceClient);
        logger.info(`Fetching databases for RDS instance ${req.params.instance}`);
        const databases = await service.getDatabases({
          kind: 'resource',
          namespace: 'default',
          name: req.params.instance,
        });

        res.send(databases);
      },
    )

  router
    .get(
      '/rds/:instance/:database/tables/',
      async (req, res) => {

        const service = new RDSService(options.config, options.catalogServiceClient);
        logger.info(`Fetching tables for database ${req.params.database} and instance ${req.params.instance}`);
        const databases = await service.getTables({
          kind: 'resource',
          namespace: 'default',
          name: req.params.instance,
        }, req.params.database);

        res.send(databases);
      },
    )

  router.use(errorHandler());
  return router;
}