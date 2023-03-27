import React from 'react';
import { Table, TableColumn, Progress, GaugeCard } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi } from '@backstage/core-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { catalogApiRef, } from '@backstage/plugin-catalog-react';
import { Grid } from '@material-ui/core';

import { pillarAdoptionApiRef } from '../../api/api';
import { PillarAdoptionServiceAPI, PillarAdoptionReport } from '@internal/plugin-reporting-common';

type DenseTableProps = {
  report: PillarAdoptionReport | undefined;
};

export const DenseTable = ({ report }: DenseTableProps) => {

  const columns: TableColumn[] = [
    { title: 'Repository', field: 'repo', width: '50%', type: 'string' },
  ];

  const data = report?.nonAdoptingRepos.map(repo => { return { repo } })

  return (
    <Table
      title="Non adopting repositories"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data || []}
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
  const ratio = (report?.totalPillarReposPercentage || 0) / 100

  return (
    <Grid container spacing={3} direction="column">
      <Grid item>
        <GaugeCard title='Adoption' progress={ratio} />
      </Grid>
      <Grid item>
        <DenseTable report={report} />
      </Grid>
    </Grid>)
};
