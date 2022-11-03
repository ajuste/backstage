
import React from 'react';
import { Typography } from '@material-ui/core';
import useAsync from 'react-use/lib/useAsync';
import { ComponentEntity, Entity } from '@backstage/catalog-model';
import {
    Progress,
    InfoCard,
    ResponseErrorPanel,
    InfoCardVariants,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import {
    catalogApiRef,
    EntityTable,
} from '@backstage/plugin-catalog-react';

import { useEntity } from '@backstage/plugin-catalog-react';

export type EntityHasUisCardProps = {
    variant?: InfoCardVariants;
};

export function EntityHasUisCard(
    props: EntityHasUisCardProps,
) {
    const { entity: domain } = useEntity();
    const title = "Has UI Components";

    const {
        variant = 'gridItem',
    } = props;

    const catalogApiClient = useApi(catalogApiRef) as CatalogApi
    const {
        value: entities,
        loading,
        error,
    } = useAsync(async () => {

        const response = await catalogApiClient.getEntities({
            filter: [
                {
                    "kind": ['Component'],
                    "spec.domain": domain.metadata.name,
                    "metadata.namespace": 'ui'
                }],
        })

        return response.items as Entity[];
    }, [catalogApiClient])


    if (loading) {

        return (
            <InfoCard variant={variant} title={title}>
                <Progress />
            </InfoCard>
        );
    } else if (error) {
        return (
            <InfoCard variant={variant} title={title}>
                <ResponseErrorPanel error={error} />
            </InfoCard>
        );
    } else {
        return (
            <EntityTable
                title={title}
                variant={variant}
                emptyContent={
                    <div style={{ textAlign: 'center' }}>
                        <Typography variant="body1">No components</Typography>
                    </div>
                }
                columns={
                    [
                        EntityTable.columns.createEntityRefColumn({ defaultKind: 'component' }),
                        EntityTable.columns.createMetadataDescriptionColumn(),
                    ]
                }
                entities={entities as ComponentEntity[]}
            />
        );
    }
}