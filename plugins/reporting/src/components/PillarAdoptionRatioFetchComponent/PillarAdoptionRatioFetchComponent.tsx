import React from 'react';
import { Table, TableColumn, Progress, Link } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogApi, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { catalogApiRef, entityRouteParams, entityRouteRef, } from '@backstage/plugin-catalog-react';
import { Entity, stringifyEntityRef, getCompoundEntityRef } from '@backstage/catalog-model';

import { pillarAdoptionApiRef } from '../../api/api';
import { PillarAdoptionServiceAPI, PillarAdoptionReport } from '@internal/plugin-reporting-common';



type DenseTableProps = {
  report: PillarAdoptionReport | undefined;
};

export const DenseTable = ({ report }: DenseTableProps) => {

  const columns: TableColumn[] = [
    { title: 'Repository', field: 'name', width: '50%', type: 'string' },
    { title: 'Catalog entry', field: 'name', width: '50px', type: 'string' },
  ];

  // const data = report.nonAdoptingRepos
  //   .map(repo => {
  //     const { entity } = entry
  //     const catalogEntityRoute = useRouteRef(entityRouteRef);
  //     const catalogLink = catalogEntityRoute(entityRouteParams(entity));

  //     if (!entry?.results[0]?.facts?.msSinceLastCommit) {
  //       console.warn(`No msSinceLastCommit fact for entity ${stringifyEntityRef(entity)}`);
  //       return null;
  //     }
  //     const [latestResult] = entry.results;
  //     const msSinceLastCommit = latestResult.facts?.msSinceLastCommit?.value as number;

  //     return {
  //       name: (
  //         <Link to={catalogLink} target="_blank">{entity.metadata.name}</Link>
  //       ),
  //       lastCommitInDays: Math.round(msSinceLastCommit / 86400000),
  //       isStale: latestResult.result,
  //     };
  //   })
  //   .filter(r => r);

  const data = [] as object[];

  return (
    <Table
      title="Non adopting repositories"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};


export const PillarAdoptionRatioFetchComponent = () => {

  const catalogApiClient = useApi(catalogApiRef) as CatalogApi;
  const pillarAdoptionApiClient = useApi(pillarAdoptionApiRef) as PillarAdoptionServiceAPI;

  const {
    value: report,
    loading,
    error,
  } = useAsync(async () => {

    return await pillarAdoptionApiClient.getTransitionRatioReport();

  }, [catalogApiClient, pillarAdoptionApiClient]);


  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return <DenseTable report={report} />;
};
