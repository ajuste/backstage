import React from 'react';

import {
  coreExtensionData,
  createExtensionDataRef,
  createExtensionInput,
  createPageExtension,
  createPlugin,
  createRouteRef,
} from '@backstage/frontend-plugin-api';
import { compatWrapper } from '@backstage/core-compat-api';
import { HomePage } from '../components/home/HomePage'


const rootRouteRef = createRouteRef();
const titleExtensionDataRef = createExtensionDataRef<string>('title');

const homePage = createPageExtension({
  defaultPath: '/',
  routeRef: rootRouteRef,
  inputs: {
    props: createExtensionInput(
      {
        children: coreExtensionData.reactElement.optional(),
        title: titleExtensionDataRef.optional(),
      },

      {
        singleton: true,
        optional: true,
      },
    ),
  },
  loader: () => Promise.resolve(compatWrapper(<HomePage />))
});

/**
 * @alpha
 */
export default createPlugin({
  id: 'home',
  extensions: [homePage],
});