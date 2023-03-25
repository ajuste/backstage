/** @public */
export interface PillarAdoptionServiceAPI {
  getTransitionRatioReport(): Promise<PillarAdoptionReport>;
}

/** @public */
export type PillarAdoptionReport = {
  totalRepos: number;
  totalPillarRepos: number;
  totalPillarReposPercentage: number;
  nonAdoptingRepos: string[];
};
