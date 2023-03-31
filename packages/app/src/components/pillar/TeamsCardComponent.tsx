
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
import {
    EntityTable,
} from '@backstage/plugin-catalog-react';
import { zfCatalogApiRef, ZFCatalogAPI } from "backstage-plugin-zf-tech-insights-common"

import { useEntity } from '@backstage/plugin-catalog-react';

export type TeamsCardComponentProps = {
    variant?: InfoCardVariants;
};

export function TeamsCardComponent(
    props: TeamsCardComponentProps,
) {
    const { entity: pillar } = useEntity();
    const pillarName = pillar.metadata.annotations?.["zerofox.com/pillar"] || ""
    const title = "Teams";

    const {
        variant = 'gridItem',
    } = props;

    const catalogApiClient = useApi(zfCatalogApiRef) as ZFCatalogAPI
    const {
        value: entities,
        loading,
        error,
    } = useAsync(async () => {

        const response = await catalogApiClient.getTeamsForPillar(pillarName)

        return response as Entity[];
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
                        EntityTable.columns.createEntityRefColumn({ defaultKind: 'group' }),
                    ]
                }
                entities={entities as ComponentEntity[]}
            />
        );
    }
}