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
      options.config,
      options.catalogServiceClient,
      options.tokenManager,
    );
  };

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
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

  router.get('/jobs', (request, response) => {
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

  router.use(errorHandler());
  return router;
}