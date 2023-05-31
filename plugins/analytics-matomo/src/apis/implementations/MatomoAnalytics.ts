import MatomoTracker from '@datapunt/matomo-tracker-js';

import {
  AnalyticsApi,
  AnalyticsEvent,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { Config } from '@backstage/config';

/**
 * Google Analytics API provider for the Backstage Analytics API.
 * @public
 */
export class MatomoAnalytics implements AnalyticsApi {
  private matomoTracker: MatomoTracker;
  /**
   * Instantiate the implementation and initialize ReactGA.
   * @param options initializes Google Analytics module with the config
   */
  private constructor(options: {
    identityApi?: IdentityApi;
    debug: boolean;
    urlBase: string;
    siteId: number;
    userId?: string;
    srcUrl?: string;
  }) {
    const { identityApi, debug, urlBase, srcUrl, siteId, userId } = options;

    this.matomoTracker = new MatomoTracker({
      urlBase,
      siteId,
      userId,
      trackerUrl: `${urlBase}/zfox`,
      srcUrl,
      disabled: debug,
      configurations: {
        setRequestMethod: 'GET',
      },
    });

    // Capture user only when explicitly enabled and provided.
    if (identityApi) {
      this.setUserFrom(identityApi).then(() => {
        return;
      });
    }
  }

  /**
   * Instantiate a fully configured GA Analytics API implementation.
   * @param config - Config object from app config
   * @param options - options with identityApi and userIdTransform config
   */
  static fromConfig(
    config: Config,
    options: {
      identityApi?: IdentityApi;
      userIdTransform?:
        | 'sha-256'
        | ((userEntityRef: string) => Promise<string>);
    } = {},
  ) {
    // Get all necessary configuration.
    const debug =
      config.getOptionalBoolean('app.analytics.matomo.debug') ?? false;
    const urlBase = config.getString('app.analytics.matomo.urlBase');
    const siteId = config.getNumber('app.analytics.matomo.siteId');
    const srcUrl = config.getString('app.analytics.matomo.srcUrl');

    return new MatomoAnalytics({
      ...options,
      debug,
      urlBase,
      siteId,
      srcUrl,
    });
  }

  getMatomoTracker() {
    return this.matomoTracker;
  }

  /**
   * Primary event capture implementation. Handles core navigate event as a
   * pageview and the rest as custom events. All custom dimensions/metrics are
   * applied as they should be (set on pageview, merged object on events).
   * @param event - AnalyticsEvent type captured
   */
  captureEvent(event: AnalyticsEvent) {
    const { action, subject } = event;

    switch (action) {
      case 'navigate':
        this.matomoTracker.trackPageView({
          documentTitle: subject,
        });
        break;

      case 'search':
        this.matomoTracker.trackSiteSearch({
          keyword: subject,
        });
        break;

      case 'click':
        this.matomoTracker.trackEvent({
          category: subject,
          action,
        });
        break;
    }
  }

  /**
   * Load user id to the tracker.
   * @param identityApi
   */
  private async setUserFrom(identityApi: IdentityApi) {
    const { userEntityRef } = await identityApi.getBackstageIdentity();

    // Set the user ID.
    this.matomoTracker.pushInstruction('setUserId', userEntityRef);
  }
}
