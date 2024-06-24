import {
  ComponentEntity,
  GroupEntity,
} from '@backstage/catalog-model';
import JiraApi from 'jira-client';


/** @public */
export interface ZFCatalogAPI {
  getPillars(): Promise<Array<ComponentEntity>>;
  getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>>;
  getPillar(pillar: string): Promise<ComponentEntity | undefined>;
  getStandaloneEntities(): Promise<Array<ComponentEntity>>;
}

export type Summary = {
  Queued: number;
  Starting: number;
  Running: number;
  Complete: number;
  Failed: number;
  Lost: number;
};

export type JobSummary = {
  CreateTime: string;
  ID: string;
  JobID: string;
  JobModifyIndex: number;
  Summary: Map<string, Summary>;
};

/** @public */
export type NomadJob = {
  CreateIndex: number;
  ID: string;
  JobModifyIndex: number;
  JobSummary: JobSummary;
  Name: string;
  Namespace: string;
  Status: string;
  SubmitTime: string;
  Type: string;
  Periodic: boolean;
  ParentID: string;
};

export type GetJobsOptions = {
  filter?: string;
};

/** @public */
export interface NomadAPI {
  getJobs(options: GetJobsOptions): Promise<Array<NomadJob>>;
}

/** @public */
export interface JiraAPI {

  /**
 * Add issue to Jira
 * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
 * @param issue - Properly Formatted Issue object
 */
  addNewIssue(issue: JiraApi.IssueObject): Promise<JiraApi.JsonResponse>;

  /**
  * Update issue in Jira
  * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290878)
  * @param issueId - the Id of the issue to update
  * @param issueUpdate - update Object as specified by the rest api
  * @param query - adds parameters to the query string
  */
  updateIssue(issueId: string, issueUpdate: JiraApi.IssueObject, query?: JiraApi.Query): Promise<JiraApi.JsonResponse>;    /**
  
  * Pass a search query to Jira
  * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e4424)
  * @param searchString - jira query string in JQL
  * @param optional - object containing any of the following properties
  */
  searchJira(searchString: string, optional?: JiraApi.SearchQuery): Promise<JiraApi.JsonResponse>;

  /**
 * Get All Sprints
 * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/sprint-getAllSprints)
 * @param boardId - Id of board to retrieve
 * @param [startAt=0] - The starting index of the returned sprints. Base index: 0.
 * @param [maxResults=50] - The maximum number of sprints to return per page.
 * Default: 50.
 * @param [state] - Filters results to sprints in specified states.
 * Valid values: future, active, closed.
 */
  getAllSprints(boardId: string, startAt?: number, maxResults?: number, state?: "future" | "active" | "closed",): Promise<JiraApi.JsonResponse>;
}

/**
 * Options for the getObject function.
 */
export type GetS3ObjectOptions = {
  bucket: string;
  key: string;
}

/**
 * Options for the saveObject function.
 */
export type SaveS3ObjectOptions = {
  bucket: string;
  key: string;
  body: string;
  contentType?: string;
  region?: string;
}

/**
 * 
 */
export type ListS3ObjectOptions = {
  bucket: string;
  prefix: string;
}

/**
 * 
 */
export type S3Object = {
  key: string;
}

/**
 * 
 */
export type ListS3ObjectOutput = {
  objects: S3Object[];
}

/** @public */
export interface S3API {
  getObject(options: GetS3ObjectOptions): Promise<string>;
  saveObject(options: SaveS3ObjectOptions): Promise<void>;
  listObjects(options: ListS3ObjectOptions): Promise<ListS3ObjectOutput>;
}
