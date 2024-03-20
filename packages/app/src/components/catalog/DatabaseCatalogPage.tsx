// DatabaseCatalogPage.tsx

import React from 'react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import Alert from '@material-ui/lab/Alert';
import { Content, ContentHeader, PageWithHeader, Progress } from '@backstage/core-components';
import { DatabaseCatalogTable } from './DatabaseCatalogTable';
import { CatalogFilterLayout, EntityListProvider } from '@backstage/plugin-catalog-react';
import { EntityPillarPicker } from './EntityPillarPicker';
import { useAsync } from 'react-use';
import { zfCatalogApiRef, ZFCatalogAPI } from 'backstage-plugin-zf-tech-insights-common';
import { EntityKindPicker, EntityTypePicker } from '@backstage/plugin-catalog-react';
import { DatabaseInstanceClassPicker } from './DatabaseInstanceClassPicker';
import { DatabaseEngineVersionPicker } from './DatabaseEngineVersionPicker';
import { DatabaseDeploymentOptionPicker } from './DatabaseDeploymentOptionPicker';

export const DatabaseCatalogPage = (): JSX.Element => {
  const catalogClient = useApi(zfCatalogApiRef) as ZFCatalogAPI;
  const orgName = useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  const { value: pillarEntities = [], loading, error } = useAsync(async () => catalogClient.getPillars());

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return (
    <PageWithHeader title={`${orgName} Database Catalog`} themeId="home">
      <Content>
        <ContentHeader title="">
        </ContentHeader>
        <EntityListProvider>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker initialFilter="Resource" hidden/>
              <EntityTypePicker initialFilter="database" hidden/>
              <EntityPillarPicker />
              <DatabaseInstanceClassPicker />
              <DatabaseEngineVersionPicker />
              <DatabaseDeploymentOptionPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <DatabaseCatalogTable pillarEntities={pillarEntities} />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
