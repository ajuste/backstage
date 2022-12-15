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

import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { ConfigApi } from '@backstage/core-plugin-api';
import Github from './github';

export interface RouterOptions {
  logger: Logger;
  config: ConfigApi;
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

  router.get('/:owner/:repo/', (request, response) => {
    logger.info(
      `Fetching resource ${request.query.path} ${request.query.branch}}`,
    );

    const owner = request.params.owner;
    const repo = request.params.repo;
    const path = request.query.path as string;
    const branch = request.query.branch as string;
    const gh = new Github(options.config);

    gh.fetch(owner, repo, branch, path)
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
