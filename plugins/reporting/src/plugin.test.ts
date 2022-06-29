import { reportingPlugin } from './plugin';

describe('reporting', () => {
  it('should export plugin', () => {
    expect(reportingPlugin).toBeDefined();
  });
});
