import { awsResourceFetcherPlugin } from './plugin';

describe('aws-resource-fetcher', () => {
  it('should export plugin', () => {
    expect(awsResourceFetcherPlugin).toBeDefined();
  });
});
