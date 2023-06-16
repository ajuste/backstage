export interface Config {
  app: {
    reporting?: {
      pillarAdoption: {
        /**
         * CSV excluded repositories from this repo
         * @visibility backend
         */
        excludedRepositories: string;
      };
    };
  };
}
