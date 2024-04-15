import React from 'react';

import {
  coreExtensionData,
  createExtensionDataRef,
  createExtensionInput,
  createPageExtension,
  createPlugin,
  createRouteRef,
  createNavItemExtension,
  createExtension,
} from '@backstage/frontend-plugin-api';
import { compatWrapper } from '@backstage/core-compat-api';
import HomeIcon from '@material-ui/icons/Home';
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

export const HomeNavIcon = createNavItemExtension({
  routeRef: rootRouteRef,
  title: 'Home',
  icon: HomeIcon,
  name: "home"
});

export const homePageExtension = createExtension({
  name: 'home',
  attachTo: { id: 'home', input: 'props' },
  output: {
    children: coreExtensionData.reactElement,
    title: titleExtensionDataRef,
  },
  factory() {
    return {
      children: <HomePage />,
      title: 'Home',
    };
  },
});