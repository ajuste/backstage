import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { Playground } from './Playground';

import { createPlugin } from '@backstage/core-plugin-api';

/**
 * @deprecated Importing and including this plugin in an app has no effect.
 * This will be removed in a future release.
 *
 * @public
 */
export const analyticsModuleMatomo = createPlugin({
  id: 'analytics-provider-matomo',
});
createDevApp()
  .registerPlugin(analyticsModuleMatomo)
  .addPage({
    path: '/ma',
    title: 'Matomo Playground',
    element: <Playground />,
  })
  .render();