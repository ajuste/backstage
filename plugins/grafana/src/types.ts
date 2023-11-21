export interface Dashboard {
    title: string;
    url: string;
    folderTitle: string;
    folderUrl: string;
    tags: string[];
    uid: string;
}

export interface Alert {
    name: string;
    state: string;
    url: string;
    owner_backstage?: string,
    owner_name?: string,
}

export interface GrafanaApi {
    dashboardsByTag(query: string): Promise<Dashboard[]>;
    listAlertsForDashboards(dashboardUUIDs: string[], selector: string): Promise<Alert[]>;
    listDashboards(query: string): Promise<Dashboard[]>;
}