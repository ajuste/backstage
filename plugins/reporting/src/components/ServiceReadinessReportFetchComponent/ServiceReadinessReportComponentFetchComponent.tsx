import React from 'react';
import { Table, TableColumn, Progress, Link } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { catalogApiRef, entityRouteParams, entityRouteRef } from '@backstage/plugin-catalog-react';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { techInsightsApiRef, TechInsightsClient } from '@backstage/plugin-tech-insights';
import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';

const GetFactsMaxRetries = 10
const GetFactsPageSize = 10

type FactsForEntity = {
  id: string
  entity: Entity
  facts: Map<string, boolean>
}

class TechInsightsExtendedClient extends TechInsightsClient {

  private readonly selfDiscoveryApi: DiscoveryApi;
  private readonly selfIdentityApi: IdentityApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    super(options)
    this.selfDiscoveryApi = options.discoveryApi;
    this.selfIdentityApi = options.identityApi;
  }

  async getLatestFactsForEntity(entity: Entity): Promise<FactsForEntity> {
    const url = await this.selfDiscoveryApi.getBaseUrl('tech-insights');
    const { token } = await this.selfIdentityApi.getCredentials();
    const response = await fetch(`${url}/facts/latest?entity=${stringifyEntityRef(entity)}`, {
      headers: token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : undefined,
    });
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    return await response.json();
  }
}

type DenseTableProps = {
  entities: FactsForEntity[]
};

export const DenseTable = ({ entities }: DenseTableProps) => {
  //const classes = useStyles();

  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Kind', field: 'kind' },
    { title: 'Branch Coverage Trend', field: 'branchCoverageTrend', width: '15%' },
    { title: 'Line Coverage Trend', field: 'lineCoverageTrend', width: '15%' },
    { title: 'Line Coverage', field: 'lineCoverage' },
    { title: 'Branch Coverage', field: 'branchCoverage' },
  ];

  const data = entities.map(facts => {
    const { entity } = facts
    const catalogEntityRoute = useRouteRef(entityRouteRef);
    const catalogLink = catalogEntityRoute(entityRouteParams(entity));
    return {
      name: (
        <Link to={catalogLink} target="_blank">{entity.metadata.name}</Link>
      ),
      kind: entity.kind,
      // lineCoverageTrend: (
      //   <TrendLine
      //     title='Line coverage trend'
      //     data={entity.coverageHistory.map(h => h.line.percentage)}
      //   />
      // ),
      // branchCoverageTrend: (
      //   <TrendLine
      //     title='Branch coverage trend'
      //     data={entity.coverageHistory.map(h => h.branch.percentage)}
      //   />
      // ),
      // lineCoverage: entity.coverageHistory?.length ? `${entity.coverageHistory[entity.coverageHistory.length - 1].line?.percentage}%` : "n/a",
      // branchCoverage: entity.coverageHistory?.length ? `${entity.coverageHistory[entity.coverageHistory.length - 1].branch?.percentage}%` : "n/a",
    };
  });

  return (
    <Table
      title="Service rediness by entity"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

/**
 * Fetch facts for an entity with max retries.
 * @param entity Entity from which to obtain facts.
 * @param techInsightAPiClient Tech insight API Client to use to query.
 * @returns 
 */
const fetchFactsForEntity = (entity: Entity, techInsightAPiClient: TechInsightsExtendedClient) =>
  new Promise(async (res, rej) => {
    for (let intent = 0; intent < GetFactsMaxRetries; intent++) {
      try {
        res(await techInsightAPiClient.getLatestFactsForEntity(entity))
      } catch (err) {
        console.warn(`Intent ${intent} failed to get facts for ${entity.metadata.name}`)
      }
    }
    rej(new Error(`Failed to get facts for ${entity.metadata.name}`))
  }) as Promise<FactsForEntity>

const fetchInsightsForEntitiesPages = async (entities: Entity[], techInsightAPiClient: TechInsightsExtendedClient) => {
  const results: FactsForEntity[] = [];
  for (let page = 0; page < entities.length / GetFactsPageSize; page++) {
    const entitiesPage = entities.slice(page * GetFactsPageSize, (page + 1) * GetFactsPageSize - 1);
    const resultsPage = await Promise.all(entitiesPage.map((e) => fetchFactsForEntity(e, techInsightAPiClient)))
    results.push(...resultsPage)
  }
  return results;
}

const fetchEntitiesWithCoverage = async (catalogApiClient: CatalogApi) =>
  (await catalogApiClient.getEntities({
    filter: {
      "metadata.annotations.backstage.io/code-coverage": "enabled",
    },
  })).items

export const ServiceReadinessReportComponentFetchComponent = () => {

  const techInsightAPiClient = useApi(techInsightsApiRef) as TechInsightsExtendedClient
  const catalogApiClient = useApi(catalogApiRef) as CatalogApi

  const {
    value: coverageByEntity,
    loading,
    error,
  } = useAsync(async () => {

    const entities = await fetchEntitiesWithCoverage(catalogApiClient)
    return await fetchInsightsForEntitiesPages(entities, techInsightAPiClient);

  }, [catalogApiClient]);


  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return <DenseTable entities={coverageByEntity || []} />;
};
