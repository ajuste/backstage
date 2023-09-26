import { createApiRef, DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { QueryEvaluator } from './query';
import { Alert, Dashboard, GrafanaApi } from './types';

interface AlertRuleGroupConfig {
  name: string;
  rules: AlertRule[];
}

interface UnifiedGrafanaAlert {
  uid: string;
  title: string;
  condition: string;
}

type Annotation = {
  __dashboardUid__: string;
}

interface AlertRule {
  labels: Record<string, string>;
  grafana_alert: UnifiedGrafanaAlert;
  annotations: Annotation;
}

interface AlertStatus {
  state: string
}

interface AlertLabels {
  rule_uid: string;
}

interface AlertInstance {
  status: AlertStatus;
  labels: AlertLabels;
  annotations: Annotation;
}

export const grafanaApiRef = createApiRef<GrafanaApi>({
  id: 'plugin.zerofox-grafana.service',
});

export type Options = {
  discoveryApi: DiscoveryApi;
  identityApi: IdentityApi;

  /**
   * Domain used by users to access Grafana web UI.
   * Example: https://monitoring.my-company.com/
   */
  domain: string;

  /**
   * Path to use for requests via the proxy, defaults to /grafana/api
   */
  proxyPath?: string;
};

const DEFAULT_PROXY_PATH = '/grafana/api';

class Client {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;
  private readonly proxyPath: string;
  private readonly queryEvaluator: QueryEvaluator;

  constructor(opts: Options) {
    this.discoveryApi = opts.discoveryApi;
    this.identityApi = opts.identityApi;
    this.proxyPath = opts.proxyPath ?? DEFAULT_PROXY_PATH;
    this.queryEvaluator = new QueryEvaluator();
  }

  public async fetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    const apiUrl = await this.apiUrl();
    const authedInit = await this.addAuthHeaders(init || {});

    const resp = await fetch(`${apiUrl}${input}`, authedInit);
    if (!resp.ok) {
      throw new Error(`Request failed with ${resp.status} ${resp.statusText}`);
    }

    return await resp.json();
  }

  async listDashboards(domain: string, query: string): Promise<Dashboard[]> {
    return this.dashboardsByTag(domain, query);
  }

  async dashboardsForQuery(domain: string, query: string): Promise<Dashboard[]> {
    const parsedQuery = this.queryEvaluator.parse(query);
    const response = await this.fetch<Dashboard[]>(`/api/search?type=dash-db`);
    const allDashboards = this.fullyQualifiedDashboardURLs(domain, response);

    return allDashboards.filter((dashboard) => {
      return this.queryEvaluator.evaluate(parsedQuery, dashboard) === true;
    });
  }

  async dashboardsByTag(domain: string, tag: string): Promise<Dashboard[]> {
    const response = await this.fetch<Dashboard[]>(`/api/search?type=dash-db&tag=${tag}`);

    return this.fullyQualifiedDashboardURLs(domain, response);
  }

  private fullyQualifiedDashboardURLs(domain: string, dashboards: Dashboard[]): Dashboard[] {
    return dashboards.map(dashboard => ({
      ...dashboard,
      url: domain + dashboard.url,
      folderUrl: domain + dashboard.folderUrl,
    }));
  }

  private async apiUrl() {
    const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');
    return proxyUrl + this.proxyPath;
  }

  private async addAuthHeaders(init: RequestInit): Promise<RequestInit> {
    const { token } = await this.identityApi.getCredentials();
    const headers = init.headers || {};

    return {
      ...init,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    };
  }
}

export class UnifiedAlertingGrafanaApiClient implements GrafanaApi {
  private readonly domain: string;
  private readonly client: Client;

  constructor(opts: Options) {
    this.domain = opts.domain;
    this.client = new Client(opts);
  }

  async dashboardsByTag(tag: string): Promise<Dashboard[]> {
    return this.client.dashboardsByTag(this.domain, tag);
  }

  async listDashboards(query: string): Promise<Dashboard[]> {
    return this.client.listDashboards(this.domain, query);
  }

  async listAlertsForDashboards(dashboardUUIDs: string[], selector: string): Promise<Alert[]> {
    const response = await this.client.fetch<Record<string, AlertRuleGroupConfig[]>>('/api/ruler/grafana/api/v1/rules');
    const alertsResponse = await this.client.fetch<Record<string, AlertInstance[]>>('/api/alertmanager/grafana/api/v2/alerts');
    const rules = Object.values(response).flat().map(ruleGroup => ruleGroup.rules).flat();
    const [label, labelValue] = selector.split('=');
    const matchingRules = rules.filter(rule => (rule.labels && rule.labels[label] === labelValue) || dashboardUUIDs.indexOf(rule.annotations?.__dashboardUid__) > -1);
    const ruleToAlert = Object.values(alertsResponse).flat().reduce((acc: Record<string, AlertInstance>, alert: AlertInstance) => {
      if (matchingRules.find(rule => rule.labels['rule_uid'] === alert.labels.rule_uid)) {
        acc[alert.labels.rule_uid] = alert;
      }
      return acc;
    }, {} as Record<string, AlertInstance>)

    return matchingRules.map(rule => {
      return {
        name: rule.grafana_alert.title,
        url: `${this.domain}/alerting/grafana/${rule.grafana_alert.uid}/view`,
        state: ruleToAlert[rule.labels['rule_uid']]?.status?.state ?? "ok"
      };
    })
  }
}