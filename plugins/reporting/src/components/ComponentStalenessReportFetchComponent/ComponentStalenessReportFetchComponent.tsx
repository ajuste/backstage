import React from 'react';
import { Table, TableColumn, Progress, Link } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogApi, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { catalogApiRef, entityRouteParams, entityRouteRef, } from '@backstage/plugin-catalog-react';
import { Entity, stringifyEntityRef, getCompoundEntityRef } from '@backstage/catalog-model';
import { techInsightsApiRef, TechInsightsClient, Check, } from '@backstage-community/plugin-tech-insights';
import { CheckResult } from '@backstage-community/plugin-tech-insights-common';
const CHECK = { id: "staleRepoCheck" } as Check;

type BulkCheckResponseWithEntity = Array<{
  entity: Entity;
  results: CheckResult[];
}>;

type DenseTableProps = {
  entities: BulkCheckResponseWithEntity;
};

export const DenseTable = ({ entities = [] }: DenseTableProps) => {

  const columns: TableColumn[] = [
    { title: 'Name', field: 'name', width: '70%px', type: 'string' },
    { title: 'Days since last commit', field: 'lastCommitInDays', width: '15%', type: 'numeric' },
    { title: 'Is stale', field: 'isStale', width: '10%', type: 'boolean' },
  ];

  const data = entities
    .map(entry => {
      const { entity } = entry
      const catalogEntityRoute = useRouteRef(entityRouteRef);
      const catalogLink = catalogEntityRoute(entityRouteParams(entity));

      if (!entry?.results[0]?.facts?.msSinceLastCommit) {
        console.warn(`No msSinceLastCommit fact for entity ${stringifyEntityRef(entity)}`);
        return null;
      }
      const [latestResult] = entry.results;
      const msSinceLastCommit = latestResult.facts?.msSinceLastCommit?.value as number;

      return {
        name: (
          <Link to={catalogLink} target="_blank">{entity.metadata.name}</Link>
        ),
        lastCommitInDays: Math.round(msSinceLastCommit / 86400000),
        isStale: latestResult.result,
      };
    })
    .filter(r => r);

  return (
    <Table
      title="Staleness report"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data as object[]}
    />
  );
};


export const ComponentStalenessReportFetchComponent = () => {

  const techInsightAPiClient = useApi(techInsightsApiRef) as TechInsightsClient;
  const catalogApiClient = useApi(catalogApiRef) as CatalogApi;

  const {
    value: entries,
    loading,
    error,
  } = useAsync(async () => {

    const { items: entities } = await catalogApiClient.getEntities({
      filter: {
        "metadata.annotations.github.com/project-slug": CATALOG_FILTER_EXISTS,
      },
    });


    const runs = await techInsightAPiClient.runBulkChecks(entities.map(getCompoundEntityRef), [CHECK])

    return runs
      .map((checkRun) => {
        const entity = entities.find(e => stringifyEntityRef(e) == checkRun.entity)
        return {
          entity,
          results: checkRun.results,
        };
      })
      .filter((checkRun) => checkRun.entity) as BulkCheckResponseWithEntity

  }, [catalogApiClient]);


  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return <DenseTable entities={entries || []} />;
};
