
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

export type SystemCardComponentProps = {
    variant?: InfoCardVariants;
};

export function SystemCardComponent(
    props: SystemCardComponentProps,
) {
    const { entity: pillar } = useEntity();
    const pillarName = pillar.metadata.annotations?.["zerofox.com/pillar"] || ""
    const title = "Services";

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
                    "kind": ['System'],
                    "metadata.annotations.zerofox.com/pillar": pillarName,
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
                        EntityTable.columns.createEntityRefColumn({ defaultKind: 'system' }),
                        EntityTable.columns.createOwnerColumn(),
                        EntityTable.columns.createMetadataDescriptionColumn(),
                    ]
                }
                entities={entities as ComponentEntity[]}
            />
        );
    }
}