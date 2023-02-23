import React, {useMemo} from 'react';

import {OverflowTooltip, TableColumn} from '@backstage/core-components';

import {useEntityList,} from '@backstage/plugin-catalog-react';

import {CatalogTable, CatalogTableProps, CatalogTableRow} from '@backstage/plugin-catalog';

const pillarAwareColumnFactories = Object.freeze({
  createPillarColumn(): TableColumn<CatalogTableRow> {
    return {
      title: 'Pillar',
      field: 'entity.metadata.annotations.zerofox.com/pillar',
      render: ({entity}) => (
          <>
            {(entity.metadata.annotations?.["zerofox.com/pillar"]) && (
                <OverflowTooltip
                    text={entity.metadata.annotations!["zerofox.com/pillar"]}
                    placement="bottom-start"
                />
            )}
          </>
      ),
      width: 'auto',
    };
  },
});

export const PillarAwareCatalogTable = (props: CatalogTableProps) => {
  const {filters} = useEntityList();

  const columns: TableColumn<CatalogTableRow>[] = useMemo(() => {
    return [
      CatalogTable.columns.createTitleColumn({hidden: true}),
      CatalogTable.columns.createNameColumn({defaultKind: filters.kind?.value}),
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
          return [pillarAwareColumnFactories.createPillarColumn(), CatalogTable.columns.createOwnerColumn()];
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

  const newProps = {...props, ...{columns}};

  return (
      <CatalogTable {...newProps}  />
  )
}