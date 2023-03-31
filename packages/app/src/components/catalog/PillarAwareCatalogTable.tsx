import React, { useMemo } from 'react';
import { TableColumn, Link } from '@backstage/core-components';
import { useEntityList, } from '@backstage/plugin-catalog-react';
import { useRouteRef } from '@backstage/core-plugin-api';
import { CatalogTable, CatalogTableProps, CatalogTableRow } from '@backstage/plugin-catalog';
import { entityRouteRef, entityRouteParams } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

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
      width: '500px',
    };
  },
});

export const PillarAwareCatalogTable = (props: PillarAwareCatalogTableProps) => {
  const { filters } = useEntityList();
  const { pillarEntities = [] } = props


  const columns: TableColumn<CatalogTableRow>[] = useMemo(() => {
    return [
      CatalogTable.columns.createTitleColumn({ hidden: true }),
      CatalogTable.columns.createNameColumn({ defaultKind: filters.kind?.value }),
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