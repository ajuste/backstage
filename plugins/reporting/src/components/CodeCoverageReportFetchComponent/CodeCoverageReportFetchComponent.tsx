import React from 'react';
import { Table, TableColumn, Progress, Link } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { codeCoveragePlugin } from '@backstage/plugin-code-coverage';
import { useApi, ApiRef, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { catalogApiRef, entityRouteParams, entityRouteRef } from '@backstage/plugin-catalog-react';
import { CodeCoverageApi, JsonCoverageHistory } from "../../types";
import { Entity, CompoundEntityRef } from '@backstage/catalog-model';


const GetCoverageMaxRetries = 10
const GetCoveragePageSize = 10

const getCoverageApiRef = (): ApiRef<CodeCoverageApi> => {
  const coverageApis = codeCoveragePlugin.getApis();
  for (let apiFactory of coverageApis) {
    const coverageApiFactory = apiFactory;
    return coverageApiFactory.api as ApiRef<CodeCoverageApi>
  }
  throw new Error(`Coverate API factory not found.`);
};

export const coverageApiRef = getCoverageApiRef()

type CoverageHistory = {
  entity: CompoundEntityRef;
  history: Array<AggregateCoverage>;
};

type AggregateCoverage = {
  timestamp: number;
  line: {
    available: number;
    covered: number;
    missed: number;
    percentage: number;
  };
  branch: {
    available: number;
    covered: number;
    missed: number;
    percentage: number;
  };
};

declare interface EntityWithCoverage extends Entity {
  coverageHistory: Array<AggregateCoverage>;
}

type DenseTableProps = {
  entities: EntityWithCoverage[];
};

const sortName = (data1: RowProps, data2: RowProps): number => {
  return data1.rawName < data2.rawName ? -1 : 1;
}

type RowProps = {
  rawName: string;
  name: any;
  kind: string;
  lineCoverage: string;
  branchCoverage: string;
};

export const DenseTable = ({ entities }: DenseTableProps) => {

  const columns: TableColumn<RowProps>[] = [
    { title: 'Name', field: 'rawName', hidden: true, searchable: true, export: true, },
    { title: 'Name', field: 'name', width: '70%', customSort: sortName, export: false },
    { title: 'Line Coverage', field: 'lineCoverage', width: '10%', export: false },
    { title: 'Branch Coverage', field: 'branchCoverage', width: '10%', export: false },
    { title: 'Line Coverage', field: 'rawLineCoverage', hidden: true, export: true },
    { title: 'Branch Coverage', field: 'rawBranchCoverage', hidden: true, export: true },
  ];

  const data = entities.map(entity => {
    const catalogEntityRoute = useRouteRef(entityRouteRef);
    const catalogLink = catalogEntityRoute(entityRouteParams(entity));

    let lastCoverage = null;
    if (entity.coverageHistory?.length) {
      lastCoverage = entity.coverageHistory[entity.coverageHistory.length - 1];
    }
    const branchCoverage = lastCoverage?.branch?.percentage;
    const lineCoverage = lastCoverage?.line?.percentage;

    return {
      rawName: entity.metadata.name,
      name: (
        <Link to={catalogLink} target="_blank">{entity.metadata.name}</Link>
      ),
      kind: entity.kind,
      lineCoverage: !lineCoverage && lineCoverage !== 0 ? "n/a" : `${lineCoverage}%`,
      branchCoverage: !branchCoverage && branchCoverage !== 0 ? "n/a" : `${branchCoverage}%`,
      rawLineCoverage: !lineCoverage && lineCoverage !== 0 ? null : lineCoverage / 100,
      rawBranchCoverage: !branchCoverage && branchCoverage !== 0 ? null : branchCoverage / 100,
    };
  });

  const csvExport = (columns: any[], renderData: any[]): void => {
    const data = [columns.map(({ title }) => title).join(",")]
    let csvData = data.concat(renderData.map((rowData) => (rowData.map((v: string) => v ? `\"${v}\"` : "")).join(","))).join('\r\n');

    const file = new File([csvData], 'coverage.csv', {
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
      title="Coverage by component"
      options={{ paging: false, padding: 'dense', exportAllData: true, exportMenu: [{ label: "As CSV", exportFunc: csvExport }] }}
      columns={columns}
      data={data}
    />
  );
};

const fetchCoverageForEntity = (entity: Entity, coverageApiClient: CodeCoverageApi) =>
  new Promise(async (res, rej) => {
    for (let intent = 0; intent < GetCoverageMaxRetries; intent++) {
      try {
        const coverageRes = await coverageApiClient.getCoverageHistoryForEntity({
          kind: entity.kind,
          namespace: entity.metadata.namespace || "default",
          name: entity.metadata.name,
        }, 1)
        res(coverageRes)
      } catch (err) {
        console.warn(`Intent ${intent} failed to get coverage for ${entity.metadata.name}`)
      }
    }
    rej(new Error(`Failed to get coverage for ${entity.metadata.name}`))
  }) as Promise<JsonCoverageHistory>

const fetchCoverageForEntitiesPages = async (entities: Entity[], coverageApiClient: CodeCoverageApi) => {
  const results: JsonCoverageHistory[] = [];
  for (let page = 0; page < entities.length / GetCoveragePageSize; page++) {
    const entitiesPage = entities.slice(page * GetCoveragePageSize, (page + 1) * GetCoveragePageSize);
    const coveragePage = await Promise.all(entitiesPage.map(e => fetchCoverageForEntity(e, coverageApiClient)))
    results.push(...coveragePage)
  }
  return results;
}

const fetchEntitiesWithCoverage = async (catalogApiClient: CatalogApi) =>
  (await catalogApiClient.getEntities({
    filter: {
      "metadata.annotations.backstage.io/code-coverage": "enabled",
    },
  })).items

export const CodeCoverageReportFetchComponent = () => {

  const catalogApiClient = useApi(catalogApiRef) as CatalogApi
  const coverageApiClient = useApi(coverageApiRef) as CodeCoverageApi

  const {
    value: coverageByEntity,
    loading,
    error,
  } = useAsync(async () => {

    const entities = await fetchEntitiesWithCoverage(catalogApiClient)
    const covarageResponse = await fetchCoverageForEntitiesPages(entities, coverageApiClient);

    return covarageResponse.map((coverage: CoverageHistory, index: number) => {
      return { ...entities[index], coverageHistory: coverage.history }
    })

  }, [catalogApiClient]);


  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return <DenseTable entities={coverageByEntity || []} />;
};
