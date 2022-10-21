
import React from 'react';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { GroupEntity } from '@backstage/catalog-model';
import { Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { CatalogApi, CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
    catalogApiRef,
} from '@backstage/plugin-catalog-react';

import { useEntity } from '@backstage/plugin-catalog-react';
import { DocsTable } from '@backstage/plugin-techdocs';

export const DocumentsComponent = () => {
    const { entity: domain } = useEntity();

    const catalogApiClient = useApi(catalogApiRef) as CatalogApi
    const {
        value: entities,
        loading,
        error,
    } = useAsync(async () => {

        const response = await catalogApiClient.getEntities({
            filter: {
                "spec.domain": domain.metadata.name,
                "metadata.annotations.backstage.io/techdocs-ref": CATALOG_FILTER_EXISTS
            },
        })

        return response.items as GroupEntity[];
    }, [catalogApiClient])


    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    } else {
        return <DocsTable entities={entities}   />
    }
}