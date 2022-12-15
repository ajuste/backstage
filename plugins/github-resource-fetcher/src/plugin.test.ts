import { githubResourceFetcherPlugin } from './plugin';

describe('github-resource-fetcher', () => {
  it('should export plugin', () => {
    expect(githubResourceFetcherPlugin).toBeDefined();
  });
});
