import {
  FactsReport,
  FactsServiceAPI,
} from '@internal/plugin-reporting-common';
import { EntityFilterQuery } from '@backstage/catalog-client';
import { CatalogApi } from '@backstage/plugin-catalog-react';
import {
  getCompoundEntityRef,
} from '@backstage/catalog-model';

import { TechInsightsApi } from '@backstage-community/plugin-tech-insights';

export default class FactServiceClient implements FactsServiceAPI {
  protected catalogApi: CatalogApi;
  protected techInsightsApi: TechInsightsApi;

  constructor(
    catalogApi: CatalogApi,
    techInsightsApi: TechInsightsApi,
  ) {
    this.catalogApi = catalogApi;
    this.techInsightsApi = techInsightsApi;
  }

  public async getEntitiesFactValues(factRetrieverId: string, factId: string): Promise<FactsReport[]> {
    return new Promise(async (resolve, reject) => {
      const res: FactsReport[] = [];
      try {
        const schemas = await this.techInsightsApi.getFactSchemas();
        let entityFilterQuery: EntityFilterQuery | undefined;
        for (const schema of schemas) {

          if (String(schema.id) == factRetrieverId && factId in schema) {
            entityFilterQuery = (schema as any).entityFilter;
            break;
          }
        }

        const getEntitiesParams: any = {};
        if (entityFilterQuery) {
          getEntitiesParams.filter = getEntitiesParams
        }
        const entities = (await this.catalogApi.getEntities(getEntitiesParams)).items;
        for (let i = 0; i < entities.length; i += 30) {
          const slice = entities.slice(i, i + 30);
          const sliceResponses = await Promise.all(slice.map((entity) => new Promise(async (resolve, reject) => {

            try {
              const entityRef = getCompoundEntityRef(entity);
              const facts = await this.techInsightsApi.getFacts(entityRef, [factRetrieverId])
              if (!facts[factRetrieverId] || !facts[factRetrieverId].facts[factId]) resolve(null);

              resolve({
                factRetrieverId,
                factId,
                entityRef,
                factValue: facts[factRetrieverId].facts[factId],
              });

            } catch (err) {
              reject(err)
            }

          }))) as FactsReport[];

          sliceResponses.filter(e => e).forEach(e => res.push(e));
        }
      } catch (e) {
        reject(e);
      }
      resolve(res);
    });
  }
}