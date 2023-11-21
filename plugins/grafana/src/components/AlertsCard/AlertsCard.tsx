import React from 'react';
import { Progress, TableColumn, Table, StatusOK, StatusPending, StatusWarning, StatusError, StatusAborted, MissingAnnotationEmptyState, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';
import { Alert } from '@material-ui/lab';
import { Alert as GrafanaAlert, GrafanaApi } from '../../types';
import { grafanaApiRef } from '../../api';
import { ZEROFOX_PILLAR, tagSelectorFromEntity, alertSelectorFromEntity, isAlertSelectorAvailable } from '../grafanaData';

export type AlertsCardOpts = {
    paged?: boolean;
    searchable?: boolean;
    pageSize?: number;
    sortable?: boolean;
    title?: string;
};

const AlertStatusBadge = ({ alert }: { alert: GrafanaAlert }) => {
    let statusElmt: React.ReactElement;
    let title: string

    switch (alert.state) {
        case "ok":
            statusElmt = <StatusOK />;
            title = "Normal";
            break;
        case "suppressed":
            statusElmt = <StatusPending />;
            title = "Suppressed";
            break;
        case "unprocessed":
            statusElmt = <StatusWarning />;
            title = "Unprocessed";
            break;
        case "active":
            statusElmt = <StatusError />;
            title = "Active";
            break;
        default:
            statusElmt = <StatusAborted />;
            title = "Unknown";
    }

    return (
        <div title={title}>{statusElmt}</div>
    );
};

export const AlertsTable = ({ alerts, opts }: { alerts: GrafanaAlert[], opts: AlertsCardOpts }) => {

    const getSortValue = (alert: GrafanaAlert): number => {
        switch (alert.state) {
            case "ok":
                return 1;
            case "suppressed":
                return 2;
            case "unprocessed":
                return 3;
            case "active":
                return 4;
            default:
                return 5;
        }
    }
    const columns: TableColumn<GrafanaAlert>[] = [
        {
            title: 'Name',
            field: 'name',
            cellStyle: { width: '90%' },
            render: (row: GrafanaAlert): React.ReactNode => <Link to={row.url} target="_blank" rel="noopener">{row.name}</Link>,
        },
    ];

    columns.push({
        title: 'State',
        customSort: (
            data1: GrafanaAlert,
            data2: GrafanaAlert,
        ) => getSortValue(data1) < getSortValue(data2) ? -1 : 1,
        defaultSort: 'desc',
        render: (row: GrafanaAlert): React.ReactNode => <AlertStatusBadge alert={row} />,
    });

    columns.push({
        title: 'Owner',
        render: row => {
            if (row.owner_backstage) {
                return <Link to={row.owner_backstage}>{row.owner_name ?? row.owner_backstage}</Link>;
            }

            return '';
        },
    });

    return (
        <Table
            title={opts.title || 'Alerts'}
            options={{
                paging: opts.paged ?? false,
                pageSize: opts.pageSize ?? 5,
                search: opts.searchable ?? false,
                emptyRowsWhenPaging: false,
                sorting: opts.sortable ?? false,
                draggable: false,
                padding: 'dense',
            }}
            data={alerts}
            columns={columns}
        />
    );
};


const Alerts = ({ entity, opts }: { entity: Entity, opts: AlertsCardOpts }) => {
    const grafanaApi = useApi(grafanaApiRef) as GrafanaApi;
    const alertSelector = alertSelectorFromEntity(entity);
    const tagSelector = tagSelectorFromEntity(entity);
    const { value, loading, error } = useAsync(async () => {
        const dashboardUUIDs = await grafanaApi.listDashboards(tagSelector);
        return await grafanaApi.listAlertsForDashboards(dashboardUUIDs.map(d => d.uid), alertSelector)
    });

    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    }

    return <AlertsTable alerts={value || []} opts={opts} />;
};


export const AlertsCard = (opts?: AlertsCardOpts) => {
    const { entity } = useEntity();

    if (!isAlertSelectorAvailable(entity)) {
        return <MissingAnnotationEmptyState annotation={ZEROFOX_PILLAR} />;
    }

    const finalOpts = { ...opts };

    return <Alerts entity={entity} opts={finalOpts} />;
};