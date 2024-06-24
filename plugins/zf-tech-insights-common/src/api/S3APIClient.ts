import { ResponseError } from '@backstage/errors';
import {
  DiscoveryApi,
  ApiRef,
  createApiRef,
} from '@backstage/core-plugin-api';
import { GetS3ObjectOptions, ListS3ObjectOptions, ListS3ObjectOutput, S3API, SaveS3ObjectOptions } from '../types';

export const s3ApiRef: ApiRef<S3API> = createApiRef({
  id: 's3',
});

export class S3APIClient implements S3API {
  private readonly discoveryApi: DiscoveryApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
  }) {
    this.discoveryApi = options.discoveryApi;
  }

  async listObjects(options: ListS3ObjectOptions): Promise<ListS3ObjectOutput> {
    const url = this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/s3/list/${options.bucket}/${options.prefix}`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    const objects = await resp.json();
    return { objects };
  }

  async getObject(options: GetS3ObjectOptions): Promise<string> {
    const url = this.discoveryApi.getBaseUrl('zf-insights')
    const resp = await fetch(`${url}/s3/${options.bucket}/${options.key}`);
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
    return await resp.text();
  }

  async saveObject(options: SaveS3ObjectOptions): Promise<void> {
    const url = this.discoveryApi.getBaseUrl('zf-insights')
    const headers = {
      'Content-Type': 'application/json',
    };
    if (options.contentType) {
      (headers as any)['X-Content-Type'] = options.contentType;
    }
    if (options.region) {
      (headers as any)['X-Region'] = options.region;
    }
    const resp = await fetch(`${url}/s3/${options.bucket}/${options.key}`, {
      method: 'PUT',
      headers,
      body: options.body,
    });
    if (!resp.ok) {
      throw await ResponseError.fromResponse(resp);
    }
  }
}
