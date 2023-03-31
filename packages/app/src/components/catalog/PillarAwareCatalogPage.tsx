import React from 'react';

import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { Content, ContentHeader, CreateButton, PageWithHeader, SupportButton, Progress } from '@backstage/core-components';
import { usePluginOptions } from '@backstage/core-plugin-api/alpha';
import { configApiRef, useApi, useRouteRef, } from '@backstage/core-plugin-api';
import { EntityPillarPicker } from './EntityPillarPicker';
import { PillarAwareCatalogTable } from './PillarAwareCatalogTable';
import { zfCatalogApiRef, ZFCatalogAPI } from 'backstage-plugin-zf-tech-insights-common'
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

import { catalogPlugin, DefaultCatalogPageProps, } from '@backstage/plugin-catalog';


type CatalogPluginOptions = {
  createButtonTitle: string;
};

const useCatalogPluginOptions = () =>
  usePluginOptions<CatalogPluginOptions>();

export const PillarAwareCatalogPage = (props: DefaultCatalogPageProps): JSX.Element => {
  const {
    actions,
    initiallySelectedFilter = 'all',
    initialKind = 'system',
    tableOptions = {},
    emptyContent,
  } = props;
  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  const createComponentLink = useRouteRef(catalogPlugin.externalRoutes.createComponent);

  const catalogClient = useApi(zfCatalogApiRef) as ZFCatalogAPI

  const {
    value: pillarEntities,
    loading,
    error,
  } = useAsync(async () => catalogClient.getPillars());

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const { createButtonTitle } = useCatalogPluginOptions();

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
              <EntityKindPicker initialFilter={initialKind} />
              <EntityPillarPicker />
              <EntityTypePicker />
              <UserListPicker initialFilter={initiallySelectedFilter} />
              <EntityOwnerPicker />
              <EntityLifecyclePicker />
              <EntityTagPicker />
              <EntityProcessingStatusPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <PillarAwareCatalogTable
                actions={actions}
                tableOptions={tableOptions}
                emptyContent={emptyContent}
                pillarEntities={pillarEntities}
              />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};