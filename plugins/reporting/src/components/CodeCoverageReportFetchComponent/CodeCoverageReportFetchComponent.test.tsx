import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { CodeCoverageReportFetchComponent, coverageApiRef } from './CodeCoverageReportFetchComponent';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import { GetEntitiesResponse, } from '@backstage/catalog-client';
import { TestApiRegistry, wrapInTestApp } from '@backstage/test-utils';
import { ApiProvider } from '@backstage/core-app-api';
import { Entity } from '@backstage/catalog-model';

const mockCoverageApi = {
  getCoverageHistoryForEntity: jest.fn(),
};

const mockCatalogApi = {
  getEntities: jest.fn(),
};

const apis = TestApiRegistry.from([coverageApiRef, mockCoverageApi], [catalogApiRef, mockCatalogApi]);

describe('CodeCoverageReportFetchComponent', () => {
  it('should render empty when no entities', async () => {

    mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({ items: [] }));
    mockCoverageApi.getCoverageHistoryForEntity = jest.fn().mockImplementationOnce(async () => []);

    render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <CodeCoverageReportFetchComponent />
        </ApiProvider>,
      ),
    );
    await waitFor(() => !screen.queryByTestId('progress'));
    expect(screen.getByText('No records to display')).toBeInTheDocument();
  });

  it('should render n/a when no coverage', async () => {

    mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({
      items: [{
        kind: "System",
        metadata: {
          name: "test",
        },
      }]
    }));
    mockCoverageApi.getCoverageHistoryForEntity = jest.fn().mockImplementationOnce(async () => ({
      entity: null,
      history: [{
        branch: {},
      }],
    }));


    render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <CodeCoverageReportFetchComponent />
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
    expect(screen.getByText("Line Coverage")).toBeInTheDocument();
    expect(screen.getByText("Branch Coverage")).toBeInTheDocument();

    // entity data
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getAllByText("n/a")[0]).toBeInTheDocument();
    expect(screen.getAllByText("n/a")[1]).toBeInTheDocument();
  });

  it('should render coverage', async () => {

    const entities = [{
      kind: "System",
      metadata: {
        name: "test",
      },
    } as Entity];

    mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({ items: entities, }) as GetEntitiesResponse);
    mockCoverageApi.getCoverageHistoryForEntity = jest.fn().mockImplementationOnce(async () => ({
      entity: null,
      history: [{
        branch: {
          percentage: 40,
        },
        line: {
          percentage: 60,
        },
      }],
    }));


    render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <CodeCoverageReportFetchComponent />
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
    expect(screen.getByText("Line Coverage")).toBeInTheDocument();
    expect(screen.getByText("Branch Coverage")).toBeInTheDocument();

    // entity data
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();

  });

});
