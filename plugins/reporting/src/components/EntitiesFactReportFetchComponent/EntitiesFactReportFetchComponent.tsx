import React from 'react';
import { Table, TableColumn, Progress, Link } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { entityRouteParams, entityRouteRef } from '@backstage/plugin-catalog-react';
import {
  FactsReport,
  FactsServiceAPI,
} from '@internal/plugin-reporting-common';

import {
  factAiRef,
} from '../../api/api'

type EntitiesFactReportFetchComponentProps = {
  factRetrieverIdschema: string;
  factId: string;
};

const sortName = (data1: RowProps, data2: RowProps): number => {
  return data1.rawName < data2.rawName ? -1 : 1;
}

type RowProps = {
  rawName: string;
  name: any;
  kind: string;
  factValue: string;
};

type DenseTableProps = {
  facts: FactsReport[];
};

export const DenseTable = (props: DenseTableProps) => {

  const columns: TableColumn<RowProps>[] = [
    { title: 'Name', field: 'rawName', hidden: true, searchable: true, export: true, },
    { title: 'Name', field: 'name', width: '40%', customSort: sortName, export: false },
    { title: 'Value', field: 'factValue', width: '25%', export: true },
    { title: 'Pillar', field: 'pillar', width: '25%', export: true },
  ];

  const data = props.facts.map(fact => {
    const catalogEntityRoute = useRouteRef(entityRouteRef);
    const entity = {
      metadata: {
        name: fact.entityRef.name,
        namespace: fact.entityRef.namespace,
      },
      apiVersion: "",
      kind: fact.entityRef.kind,
      name: fact.entityRef.name,
    }
    const catalogLink = catalogEntityRoute(entityRouteParams(entity));
    return {
      rawName: entity.metadata.name,
      name: (
        <Link to={catalogLink} target="_blank">{entity.metadata.name}</Link>
      ),
      kind: entity.kind,
      factValue: String(fact.factValue),
      pillar: fact.pillar,
    }
  });

  const csvExport = (columns: any[], renderData: any[]): void => {
    const data = [columns.map(({ title }) => title).join(",")]
    let csvData = data.concat(renderData.map((rowData) => (rowData.map((v: string) => v ? `\"${v}\"` : "")).join(","))).join('\r\n');

    const file = new File([csvData], 'facts.csv', {
      type: 'text/csv',
    })

    const link = document.createElement('a')
    const url = URL.createObjectURL(file)

    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Table
      title="Facts by entity"
      options={{ paging: false, padding: 'dense', exportAllData: true, exportMenu: [{ label: "As CSV", exportFunc: csvExport }] }}
      columns={columns}
      data={data}
    />
  );
};

export const EntitiesFactReportFetchComponent = (props: EntitiesFactReportFetchComponentProps) => {

  const factsApiClient = useApi(factAiRef) as FactsServiceAPI

  const {
    value: facts,
    loading,
    error,
  } = useAsync(async () => {

    return factsApiClient.getEntitiesFactValues(props.factRetrieverIdschema, props.factId)

  }, [factsApiClient, props]);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return <DenseTable facts={(facts || [])} />;
};
