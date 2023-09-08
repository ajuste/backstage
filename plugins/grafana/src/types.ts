export interface Dashboard {
    title: string;
    url: string;
    folderTitle: string;
    folderUrl: string;
    tags: string[];
}

export interface Alert {
    name: string;
    state: string;
    url: string;
}

export interface GrafanaApi {
    domain: string;
    dashboardsByTag(query: string, domain: string): Promise<Dashboard[]>;
    alertsForSelector(selector: string): Promise<Alert[]>;
}