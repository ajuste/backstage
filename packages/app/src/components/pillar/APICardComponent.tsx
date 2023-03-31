
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

export type APICardComponentProps = {
    variant?: InfoCardVariants;
};

export function APICardComponent(
    props: APICardComponentProps,
) {
    const { entity: pillar } = useEntity();
    const pillarName = pillar.metadata.annotations?.["zerofox.com/pillar"] || ""
    const title = "APIs";

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
                    "kind": ['API'],
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
                        EntityTable.columns.createEntityRefColumn({ defaultKind: 'api' }),
                        EntityTable.columns.createMetadataDescriptionColumn(),
                    ]
                }
                entities={entities as ComponentEntity[]}
            />
        );
    }
}