import React, { useMemo } from 'react';
import Alert from '@material-ui/lab/Alert';
import { TableColumn, Link, Progress, } from '@backstage/core-components';
import { useEntityList, } from '@backstage/plugin-catalog-react';
import { useRouteRef, useApi } from '@backstage/core-plugin-api';
import { CatalogTable, CatalogTableProps, CatalogTableRow } from '@backstage/plugin-catalog';
import { entityRouteRef, entityRouteParams, } from '@backstage/plugin-catalog-react';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import {
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { JsonObject } from '@backstage/types';
import useAsync from 'react-use/lib/useAsync';

type PillarAwareCatalogTableProps = CatalogTableProps & {
  pillarEntities: Array<Entity> | undefined;
}

const pillarAwareColumnFactories = Object.freeze({
  createPillarColumn(pillarEntities: Array<Entity>): TableColumn<CatalogTableRow> {
    return {
      title: 'Pillar',
      field: 'entity.metadata.annotations.zerofox.com/pillar',
      render: ({ entity }) => {
        const pillar = entity.metadata.annotations?.["zerofox.com/pillar"]
        if (!pillar) {
          return null
        }
        let link = ""
        const pillarComponent = pillarEntities.find(pillarEntity => pillarEntity.metadata.annotations?.["zerofox.com/pillar"] === pillar)
        if (pillarComponent) {
          const catalogEntityRoute = useRouteRef(entityRouteRef);
          link = catalogEntityRoute(entityRouteParams(pillarComponent))
        }
        return <Link to={link} target="_blank">{pillar}</Link>
      },
    };
  },
  createNameColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Name',
      render: ({ entity }) => {
        const catalogEntityRoute = useRouteRef(entityRouteRef);
        const catalogApiClient = useApi(catalogApiRef) as CatalogApi
        const {
          value,
          loading,
          error,
        } = useAsync(async () => {

          return catalogApiClient.getEntityByRef(stringifyEntityRef(entity));

        }, [catalogApiClient]);


        if (loading) {
          return <Progress />;
        } else if (error) {
          return <Alert severity="error">{error.message}</Alert>;
        }
        if (!value) {
          return null
        }

        const name = (value.spec?.profile as JsonObject)?.displayName || value.metadata.name;
        const link = catalogEntityRoute(entityRouteParams(value))
        return <Link to={link} target="_blank">{name}</Link>;
      },
    };
  }
});

export const PillarAwareCatalogTable = (props: PillarAwareCatalogTableProps) => {
  const { filters } = useEntityList();
  const { pillarEntities = [] } = props


  const columns: TableColumn<CatalogTableRow>[] = useMemo(() => {
    return [
      CatalogTable.columns.createTitleColumn({ hidden: true }),
      pillarAwareColumnFactories.createNameColumn(),
      pillarAwareColumnFactories.createPillarColumn(pillarEntities),
      ...createEntitySpecificColumns(),
      CatalogTable.columns.createMetadataDescriptionColumn(),
      CatalogTable.columns.createTagsColumn(),
    ];

    function createEntitySpecificColumns(): TableColumn<CatalogTableRow>[] {
      switch (filters.kind?.value) {
        case 'user':
          return [];
        case 'domain':
        case 'system':
          return [CatalogTable.columns.createOwnerColumn()];
        case 'group':
        case 'template':
          return [CatalogTable.columns.createSpecTypeColumn()];
        case 'location':
          return [
            CatalogTable.columns.createSpecTypeColumn(),
            CatalogTable.columns.createSpecTargetsColumn(),
          ];
        default:
          return [
            CatalogTable.columns.createSystemColumn(),
            CatalogTable.columns.createOwnerColumn(),
            CatalogTable.columns.createSpecTypeColumn(),
            CatalogTable.columns.createSpecLifecycleColumn(),
          ];
      }
    }
  }, [filters.kind?.value]);

  const newProps = { ...props, ...{ columns } };

  return (
    <CatalogTable {...newProps} />
  )
}