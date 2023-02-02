import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { ComponentStalenessReportFetchComponent } from './ComponentStalenessReportFetchComponent';
import { techInsightsApiRef, } from '@backstage/plugin-tech-insights';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import { GetEntitiesResponse, } from '@backstage/catalog-client';
import { TestApiRegistry, wrapInTestApp } from '@backstage/test-utils';
import { ApiProvider } from '@backstage/core-app-api';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';

const mockTechInsightsApi = {
  runBulkChecks: jest.fn(),
};

const mockCatalogApi = {
  getEntities: jest.fn(),
};

const apis = TestApiRegistry.from([techInsightsApiRef, mockTechInsightsApi], [catalogApiRef, mockCatalogApi]);

describe('ComponentStalenessReportFetchComponent', () => {
  it('should render empty when no entities', async () => {

    mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({ items: [] }));
    mockTechInsightsApi.runBulkChecks = jest.fn().mockImplementationOnce(async () => []);

    render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <ComponentStalenessReportFetchComponent />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !screen.queryByTestId('progress'));
    expect(screen.getByText('No records to display')).toBeInTheDocument();
  });

  it('should render empty when no runs', async () => {

    mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({
      items: [{
        kind: "System",
        metadata: {
          name: "test",
        },
      } as Entity]
    }) as GetEntitiesResponse);
    mockTechInsightsApi.runBulkChecks = jest.fn().mockImplementationOnce(async () => []);

    render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <ComponentStalenessReportFetchComponent />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !screen.queryByTestId('progress'));
    expect(screen.getByText('No records to display')).toBeInTheDocument();
  });

  it('should render runs', async () => {

    const entities = [{
      kind: "System",
      metadata: {
        name: "test",
      },
    } as Entity];

    mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({ items: entities, }) as GetEntitiesResponse);
    mockTechInsightsApi.runBulkChecks = jest.fn().mockImplementationOnce(async (entities) => entities.map((entity: Entity) => ({
      entity: stringifyEntityRef(entity),
      results: [{
        facts: {
          msSinceLastCommit: {
            value: 1675445490305,
          }
        }
      }]
    })));


    render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <ComponentStalenessReportFetchComponent />
        </ApiProvider>,
        {
          routeEntries: ['/catalog/:namespace/:kind/:name'],
          mountedRoutes: {
            '/catalog/:namespace/:kind/:name': entityRouteRef,
          },
        },
      ),
    );
    await waitFor(() => !screen.queryByTestId('progress'));

    // check headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Days since last commit")).toBeInTheDocument();
    expect(screen.getByText("Is stale")).toBeInTheDocument();

    // entity data
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText(19392)).toBeInTheDocument();
    
  });

});
