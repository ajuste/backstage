import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { SystemCardComponent } from './SystemCardComponent';
import { TestApiRegistry, wrapInTestApp } from '@backstage/test-utils';
import { GetEntitiesResponse, } from '@backstage/catalog-client';
import { ApiProvider } from '@backstage/core-app-api';
import { Entity, RELATION_OWNED_BY } from '@backstage/catalog-model';
import { catalogApiRef, EntityProvider, entityRouteRef } from '@backstage/plugin-catalog-react';

const mockCatalogApi = {
    getEntities: jest.fn(),
};

const apis = TestApiRegistry.from([catalogApiRef, mockCatalogApi]);


describe('SystemCardComponent', () => {
    it('should render available systems for a pillar', async () => {

        const entities = [{
            kind: "System",
            metadata: {
                name: "system-test",
                description: "Hello",
            },
            relations: [
                {
                    type: RELATION_OWNED_BY,
                    targetRef: "group:default/owning-team",
                },
            ],
        } as Entity];

        const pillar = {
            kind: "System",
            apiVersion: "v1",
            metadata: {
                name: "pillar-test",
                annotations: {
                    "zerofox.com/pillar": "test",
                },
            },
        } as Entity

        mockCatalogApi.getEntities = jest.fn().mockImplementationOnce(async () => ({ items: entities, }) as GetEntitiesResponse);

        render(
            wrapInTestApp(
                <ApiProvider apis={apis}>
                    <EntityProvider entity={pillar}>
                        <SystemCardComponent />
                    </EntityProvider>
                </ApiProvider>,
                {
                    routeEntries: ['/catalog/:namespace/:kind/:name'],
                    mountedRoutes: {
                        '/catalog/:namespace/:kind/:name': entityRouteRef,
                    },
                },
            ),
        );
        await waitFor(() => screen.getByText('Services'));

        // Name column
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('system-test')).toBeInTheDocument();

        // Owner
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('owning-team')).toBeInTheDocument();

        expect(mockCatalogApi.getEntities).toBeCalledWith({ filter: [{ kind: ['System'], 'metadata.annotations.zerofox.com/pillar': 'test', }], });

    });
});
