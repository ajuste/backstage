import React from 'react';

import { grafanaPlugin, } from '@k-phoen/backstage-plugin-grafana';

import { Progress, TableColumn, Table, StatusOK, StatusPending, StatusWarning, StatusError, StatusAborted, MissingAnnotationEmptyState, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';
import { Alert } from '@material-ui/lab';
import { Alert as GrafanaAlert, GrafanaApi } from '../../types';
import { ZEROFOX_PILLAR, tagSelectorFromEntity, alertSelectorFromEntity, isAlertSelectorAvailable, isDashboardSelectorAvailable } from '../grafanaData';

const grafanaApiRef = Array.from(grafanaPlugin.getApis())[0].api;

export type AlertsCardOpts = {
    paged?: boolean;
    searchable?: boolean;
    pageSize?: number;
    sortable?: boolean;
    title?: string;
    showState?: boolean;
};

const AlertStatusBadge = ({ alert }: { alert: GrafanaAlert }) => {
    let statusElmt: React.ReactElement;
    let title: string

    switch (alert.state) {
        case "ok":
            statusElmt = <StatusOK />;
            title = "Ok";
            break;
        case "paused":
            statusElmt = <StatusPending />;
            title = "Paused";
            break;
        case "no_data":
            statusElmt = <StatusWarning />;
            title = "No data";
            break;
        case "pending":
            statusElmt = <StatusWarning />;
            title = "Pending";
            break;
        case "alerting":
            statusElmt = <StatusError />;
            title = "Alerting";
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
            case "paused":
                return 2;
            case "no_data":
                return 3;
            case "pending":
                return 4;
            case "alerting":
                return 6;
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

    if (opts.showState) {
        columns.push({
            title: 'State',
            customSort: (
                data1: GrafanaAlert,
                data2: GrafanaAlert,
            ) => getSortValue(data1) < getSortValue(data2) ? -1 : 1,
            defaultSort: 'desc',
            render: (row: GrafanaAlert): React.ReactNode => <AlertStatusBadge alert={row} />,
        });
    }

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
    const configApi = useApi(configApiRef);
    const unifiedAlertingEnabled = configApi.getOptionalBoolean('grafana.unifiedAlerting') || false;
    const alertSelector = unifiedAlertingEnabled ? alertSelectorFromEntity(entity) : tagSelectorFromEntity(entity);

    const { value, loading, error } = useAsync(async () => await grafanaApi.alertsForSelector(alertSelector));

    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    }

    return <AlertsTable alerts={value || []} opts={opts} />;
};


export const AlertsCard = (opts?: AlertsCardOpts) => {
    const { entity } = useEntity();
    const configApi = useApi(configApiRef);
    const unifiedAlertingEnabled = configApi.getOptionalBoolean('grafana.unifiedAlerting') || false;

    if (!unifiedAlertingEnabled && !isDashboardSelectorAvailable(entity)) {
        return <MissingAnnotationEmptyState annotation={ZEROFOX_PILLAR} />;
    }

    if (unifiedAlertingEnabled && !isAlertSelectorAvailable()) {
        return <MissingAnnotationEmptyState annotation={ZEROFOX_PILLAR} />;
    }

    const finalOpts = { ...opts, ...{ showState: opts?.showState && !unifiedAlertingEnabled } };

    return <Alerts entity={entity} opts={finalOpts} />;
};