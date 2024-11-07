import JiraApi from 'jira-client';
import { JiraAPI } from "backstage-plugin-zf-tech-insights-common";
import {
    ConfigApi,
} from '@backstage/core-plugin-api';


export class JiraProxyAPIClient implements JiraAPI {
    private configApi: ConfigApi;
    private jiraClient: JiraApi;

    constructor(
        configApi: ConfigApi,
    ) {
        this.configApi = configApi;
        this.jiraClient = new JiraApi({
            protocol: 'https',
            host: this.configApi.getString('jira.addr'),
            username: this.configApi.getString('jira.user'),
            password: this.configApi.getString('jira.bearer'),
            apiVersion: '2',
            strictSSL: true
        });
    }

    async addNewIssue(issue: JiraApi.IssueObject): Promise<JiraApi.JsonResponse> {
        return this.jiraClient.addNewIssue(issue);
    }

    async updateIssue(issueId: string, issueUpdate: JiraApi.IssueObject, query?: JiraApi.Query): Promise<JiraApi.JsonResponse> {
        return this.jiraClient.updateIssue(issueId, issueUpdate, query);
    }

    async searchJira(searchString: string, optional?: JiraApi.SearchQuery): Promise<JiraApi.JsonResponse> {
        return this.jiraClient.searchJira(searchString, optional);
    }

    async getAllSprints(boardId: string, startAt?: number, maxResults?: number, state?: "future" | "active" | "closed",): Promise<JiraApi.JsonResponse> {
        return this.jiraClient.getAllSprints(boardId, startAt, maxResults, state);
    }
}