import { ConfigReader } from '@backstage/config';
import MatomoTracker from '@datapunt/matomo-tracker-js';
import { MatomoAnalytics } from './MatomoAnalytics';

jest.genMockFromModule('@datapunt/matomo-tracker-js');
jest.mock('@datapunt/matomo-tracker-js');

afterEach(() => {
  jest.resetAllMocks();
});

describe('MatomoAnalytics', () => {
  const context = {
    extension: 'App',
    pluginId: 'some-plugin',
    routeRef: 'unknown',
    releaseNum: 1337,
  };
  const urlBase = 'https://stats.zerofox.com';
  const srcUrl = 'https://cdn.zerofox.com/stats/stats.js';
  const siteId = 1;
  const basicValidConfig = new ConfigReader({
    app: {
      analytics: {
        matomo: {
          urlBase,
          siteId,
          srcUrl,
        },
      },
    },
  });

  describe('captureEvent', () => {
    it('should capture navigate action', () => {
      (MatomoTracker as jest.Mock).mockImplementation(() => {
        return {
          trackPageView: jest.fn(),
        };
      });

      const api = MatomoAnalytics.fromConfig(basicValidConfig);
      api.captureEvent({
        action: 'navigate',
        subject: '/test',
        context,
      });
      expect(api.captureEvent).toBeDefined();
      expect(api.getMatomoTracker().trackPageView).toHaveBeenCalledWith({
        'documentTitle': '/test',
      });
    });

    it('should capture search action', () => {
      (MatomoTracker as jest.Mock).mockImplementation(() => {
        return {
          trackSiteSearch: jest.fn(),
        };
      });

      const api = MatomoAnalytics.fromConfig(basicValidConfig);
      api.captureEvent({
        action: 'search',
        subject: 'term',
        context,
      });
      expect(api.captureEvent).toBeDefined();
      expect(api.getMatomoTracker().trackSiteSearch).toHaveBeenCalledWith({
        'keyword': 'term',
      });
    });

    it('should capture click action', () => {
      (MatomoTracker as jest.Mock).mockImplementation(() => {
        return {
          trackEvent: jest.fn(),
        };
      });

      const api = MatomoAnalytics.fromConfig(basicValidConfig);
      api.captureEvent({
        action: 'click',
        subject: '/',
        context,
      });
      expect(api.captureEvent).toBeDefined();
      expect(api.getMatomoTracker().trackEvent).toHaveBeenCalledWith({
        'action': 'click',
        'category': '/',
      });
    });
  });

  describe('fromConfig', () => {
    it('throws when missing urlBase', () => {
      const config = new ConfigReader({
        app: {
          analytics: {
            matomo: {
              siteId: 1,
              srcUrl: 'https://test.com/1',
            },
          },
        },
      });
      expect(() => MatomoAnalytics.fromConfig(config)).toThrow(
        /Missing required config value/,
      );
    });

    it('throws when missing siteId', () => {
      const config = new ConfigReader({
        app: {
          analytics: {
            matomo: {
              urlBase: 'https://test.com',
              srcUrl: 'https://test.com/1',
            },
          },
        },
      });
      expect(() => MatomoAnalytics.fromConfig(config)).toThrow(
        /Missing required config value/,
      );
    });

    it('throws when missing srcUrl', () => {
      const config = new ConfigReader({
        app: {
          analytics: {
            matomo: {
              urlBase: 'https://test.com',
              siteId: 1,
            },
          },
        },
      });
      expect(() => MatomoAnalytics.fromConfig(config)).toThrow(
        /Missing required config value/,
      );
    });

    it('returns implementation', () => {
      const api = MatomoAnalytics.fromConfig(basicValidConfig);

      expect(api.captureEvent).toBeDefined();

      api.captureEvent({
        action: 'navigate',
        subject: '/',
        context,
      });
    });
  });
});
