/** @public */
export type FetchS3ObjectOptions = {
    key: string;
    bucket: string;
};

/** @public */
export interface AWSResourceFetcherAPI {
    fetchS3Object: (options: FetchS3ObjectOptions) => Promise<any>;
}
