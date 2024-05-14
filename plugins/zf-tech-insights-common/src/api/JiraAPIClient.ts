import { ApiRef, DiscoveryApi, createApiRef } from '@backstage/core-plugin-api';
import { JiraAPI } from '../types';

export const jiraApiRef: ApiRef<JiraAPI> = createApiRef({
  id: 'jira-nomad',
});

export class JiraAPIClient implements JiraAPI {
  url: string = '';

  constructor(public discovery: DiscoveryApi) { }

  async searchJira(searchString: string): Promise<any> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('zf-insights');
    }
    const res = await fetch(`${this.url}/jira/search?searchString=${encodeURIComponent(searchString)}`)
    return res.json();
  }

  async getIssue(issueId: string): Promise<any> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('zf-insights');
    }
    const res = await fetch(`${this.url}/jira/issue/${issueId}`)
    return res.json();
  }

  async addNewIssue(issue: any): Promise<any> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('zf-insights');
    }
    const res = await fetch(`${this.url}/jira/issue`, {
      method: 'PUT',
      body: JSON.stringify(issue),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.json();
  }

  async updateIssue(issueId: string, issueUpdate: any, query?: any): Promise<any> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('zf-insights');
    }
    const res = await fetch(`${this.url}/jira/issue/${issueId}`, {
      method: 'POST',
      body: JSON.stringify({ issueUpdate, query }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.json();
  }

  async getAllSprints(boardId: string, startAt?: number, maxResults?: number, state?: "future" | "active" | "closed"): Promise<any> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('zf-insights');
    }
    const res = await fetch(`${this.url}/jira/sprints?boardId=${boardId}${startAt ? `&startAt=${startAt}` : ''}${maxResults ? `&maxResults=${maxResults}` : ''}${state ? `&state=${state}` : ''}`)
    return res.json();
  }
}