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

import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import ZFCatalogService from './catalog';
import { createRouter } from './router';

jest.genMockFromModule('./catalog');
jest.mock('./catalog');

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      catalogServiceClient: {} as any,
      discovery: {} as any,
      config: {} as any,
      tokenManager: {} as any,
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /pillar', () => {
    it('returns all pillars', async () => {
      (ZFCatalogService as jest.Mock).mockImplementation(() => {
        return {
          getPillars: jest.fn(() => {
            return Promise.resolve([
              {
                id: '1',
                name: 'Pillar 1',
                description: 'Pillar 1 description',
              },
            ]);
          }),
        };
      });

      const response = await request(app).get('/pillar');

      expect(response.text).toEqual('[{\"id\":\"1\",\"name\":\"Pillar 1\",\"description\":\"Pillar 1 description\"}]');
      expect(response.status).toEqual(200);
    });
  });

  describe('GET /entities/with-repo', () => {
    it('returns all entities with repositories', async () => {
      (ZFCatalogService as jest.Mock).mockImplementation(() => {
        return {
          getEntityWithRepos: jest.fn(() => {
            return Promise.resolve([
              {
                id: '1',
                name: 'Component 1',
                description: 'Description',
              },
            ]);
          }),
        };
      });

      const response = await request(app).get('/entities/with-repo');

      expect(response.text).toEqual('[{\"id\":\"1\",\"name\":\"Component 1\",\"description\":\"Description\"}]');
      expect(response.status).toEqual(200);
    });
  });
});
