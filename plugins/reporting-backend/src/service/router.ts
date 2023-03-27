/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PluginEndpointDiscovery } from '@backstage/backend-common';
import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { ConfigApi } from '@backstage/core-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { TokenManager } from '@backstage/backend-common';
import PillarAdoptionService from './PillarAdoptionService';

export interface RouterOptions {
  logger: Logger;
  config: ConfigApi;
  discovery: PluginEndpointDiscovery;
  tokenManager: TokenManager;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/pillar-adoption/ratio', (_, response) => {
    logger.info(`Fetching resource pillar adoption ratio`);

    const catalogClient = new CatalogClient({
      discoveryApi: options.discovery,
    });

    const gh = new PillarAdoptionService(
      options.config,
      options.logger,
      catalogClient,
      options.tokenManager,
    );

    gh.getTransitionRatioReport()
      .then(res => {
        response.send(res);
        response.end();
      })
      .catch(err => {
        logger.error(err);
        response.status(500).json({ error: err });
      });
  });

  router.use(errorHandler());
  return router;
}
