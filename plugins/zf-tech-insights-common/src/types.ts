import {
  ComponentEntity,
  GroupEntity,
} from '@backstage/catalog-model';

/** @public */
export interface ZFCatalogAPI {
  getPillars(): Promise<Array<ComponentEntity>>;
  getTeamsForPillar(pillar: string): Promise<Array<GroupEntity>>;
  getPillar(pillar: string): Promise<ComponentEntity | undefined>;
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
