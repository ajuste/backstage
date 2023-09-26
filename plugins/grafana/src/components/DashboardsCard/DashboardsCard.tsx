import React from 'react';
import { Progress, TableColumn, Table, MissingAnnotationEmptyState, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';
import { Alert } from '@material-ui/lab';
import { Tooltip } from '@material-ui/core';
import { Dashboard, GrafanaApi } from '../../types';
import { grafanaApiRef } from '../../api';
import { dashboardSelectorFromEntity, ZEROFOX_PILLAR, isDashboardSelectorAvailable } from '../grafanaData';

export const DashboardsTable = ({ entity, dashboards, opts }: { entity: Entity, dashboards: Dashboard[], opts: DashboardCardOpts }) => {
    const columns: TableColumn<Dashboard>[] = [
        {
            title: 'Title',
            field: 'title',
            render: (row: Dashboard) => <Link to={row.url} target="_blank" rel="noopener">{row.title}</Link>,
        },
        {
            title: 'Folder',
            field: 'folderTitle',
            render: (row: Dashboard) => <Link to={row.folderUrl} target="_blank" rel="noopener">{row.folderTitle}</Link>,
        },
    ];

    const titleElm = (
        <Tooltip title={`Note: only dashboard with the "${dashboardSelectorFromEntity(entity)}" selector are displayed.`}>
            <span>{opts.title || 'Dashboards'}</span>
        </Tooltip>
    );

    return (
        <Table
            title={titleElm}
            options={{
                paging: opts.paged ?? false,
                pageSize: opts.pageSize ?? 5,
                search: opts.searchable ?? false,
                emptyRowsWhenPaging: false,
                sorting: opts.sortable ?? false,
                draggable: false,
                padding: 'dense',
            }}
            data={dashboards}
            columns={columns}
        />
    );
};

const Dashboards = ({ entity, opts }: { entity: Entity, opts: DashboardCardOpts }) => {
    const grafanaApi = useApi(grafanaApiRef) as GrafanaApi;
    const { value, loading, error } = useAsync(async () => await grafanaApi.dashboardsByTag(dashboardSelectorFromEntity(entity)));

    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    }

    return (
        <DashboardsTable entity={entity} dashboards={value || []} opts={opts} />
    );
};

export type DashboardCardOpts = {
    paged?: boolean;
    searchable?: boolean;
    pageSize?: number;
    sortable?: boolean;
    title?: string;
};

export const DashboardsCard = (opts?: DashboardCardOpts) => {
    const { entity } = useEntity();

    return !isDashboardSelectorAvailable(entity) ? (
        <MissingAnnotationEmptyState annotation={ZEROFOX_PILLAR} />
    ) : (
        <Dashboards entity={entity} opts={opts || {}} />
    );
};