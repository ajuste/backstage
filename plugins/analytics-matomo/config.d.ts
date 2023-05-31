export interface Config {
  app: {
    analytics?: {
      matomo: {
        /**
         * Matomo site ID
         * @visibility frontend
         */
        siteId: number;

        /**
         * Matomo base url
         * @visibility frontend
         */
        urlBase: string;

        /**
         * JS script location
         * @visibility frontend
         */
        srcUrl: string;

        /**
         * Whether to log analytics debug statements to the console.
         * Defaults to false.
         *
         * @visibility frontend
         */
        debug?: boolean;
      };
    };
  };
}
