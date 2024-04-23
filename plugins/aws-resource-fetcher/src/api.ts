import { ResponseError } from '@backstage/errors';
import { createApiRef, DiscoveryApi } from '@backstage/core-plugin-api';
import { AWSResourceFetcherAPI, FetchS3ObjectOptions } from "@internal/backstage-plugin-aws-resource-fetcher-common";

export const awsResourceFetcherApiRef = createApiRef<AWSResourceFetcherAPI>({
  id: 'plugin.aws-resource-fetcher.service',
});

export class AWSResourceFetcherRestAPI implements AWSResourceFetcherAPI {
  url: string = '';

  constructor(public discovery: DiscoveryApi) { }

  async fetchS3Object(options: FetchS3ObjectOptions): Promise<string> {
    if (!this.url) {
      this.url = await this.discovery.getBaseUrl('aws-resource-fetcher');
    }
    const resp = await fetch(`${this.url}/s3/${options.bucket}/${options.key}`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    return await resp.text();
  }
}
