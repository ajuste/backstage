import React from 'react';

import {Content, ContentHeader, CreateButton, PageWithHeader, SupportButton} from '@backstage/core-components';

import {usePluginOptions} from '@backstage/core-plugin-api/alpha';

import {configApiRef, useApi, useRouteRef} from '@backstage/core-plugin-api';

import {EntityPillarPicker} from './EntityPillarPicker';
import {PillarAwareCatalogTable} from './PillarAwareCatalogTable';

import {
  CatalogFilterLayout,
  EntityKindPicker,
  EntityLifecyclePicker,
  EntityListProvider,
  EntityOwnerPicker,
  EntityProcessingStatusPicker,
  EntityTagPicker,
  EntityTypePicker,
  UserListPicker,
} from '@backstage/plugin-catalog-react';

import {catalogPlugin, DefaultCatalogPageProps,} from '@backstage/plugin-catalog';


type CatalogPluginOptions = {
  createButtonTitle: string;
};

const useCatalogPluginOptions = () =>
    usePluginOptions<CatalogPluginOptions>();

export const PillarAwareCatalogPage = (props: DefaultCatalogPageProps): JSX.Element => {
  const {
    actions,
    initiallySelectedFilter = 'owned',
    initialKind = 'component',
    tableOptions = {},
    emptyContent,
  } = props;
  const orgName =
      useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';
  const createComponentLink = useRouteRef(catalogPlugin.externalRoutes.createComponent);

  const {createButtonTitle} = useCatalogPluginOptions();

  return (
      <PageWithHeader title={`${orgName} Catalog`} themeId="home">
        <Content>
          <ContentHeader title="">
            <CreateButton
                title={createButtonTitle}
                to={createComponentLink && createComponentLink()}
            />
            <SupportButton>All your software catalog entities</SupportButton>
          </ContentHeader>
          <EntityListProvider>
            <CatalogFilterLayout>
              <CatalogFilterLayout.Filters>
                <EntityKindPicker initialFilter={initialKind}/>
                <EntityPillarPicker/>
                <EntityTypePicker/>
                <UserListPicker initialFilter={initiallySelectedFilter}/>
                <EntityOwnerPicker/>
                <EntityLifecyclePicker/>
                <EntityTagPicker/>
                <EntityProcessingStatusPicker/>
              </CatalogFilterLayout.Filters>
              <CatalogFilterLayout.Content>
                <PillarAwareCatalogTable
                    actions={actions}
                    tableOptions={tableOptions}
                    emptyContent={emptyContent}
                />
              </CatalogFilterLayout.Content>
            </CatalogFilterLayout>
          </EntityListProvider>
        </Content>
      </PageWithHeader>
  );
};