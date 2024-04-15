/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import MapIcon from '@material-ui/icons/MyLocation';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import ReportingIcon from '@material-ui/icons/Assessment';
import CategoryIcon from '@material-ui/icons/Category';
import CreateIcon from '@material-ui/icons/AddCircleOutline';
import SettingsIcons from '@material-ui/icons/Settings';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import {
  createExtension,
  coreExtensionData,
  createExtensionInput,
  createNavItemExtension,
  createNavLogoExtension,
} from '@backstage/frontend-plugin-api';
import { makeStyles } from '@material-ui/core/styles';
import {
  Sidebar,
  useSidebarOpenState,
  Link,
  sidebarConfig,
  SidebarDivider,
  SidebarItem,
  SidebarSubmenuItem,
  SidebarGroup,
  SidebarSpace,
  SidebarSubmenu,
  SidebarScrollWrapper,
} from '@backstage/core-components';
import LogoIcon from '../components/logos/Icon';
import LogoFull from '../components/logos/Full';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { Radars } from './TechRadar';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = (
  props: (typeof createNavLogoExtension.logoElementsDataRef)['T'],
) => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen
          ? props?.logoFull ?? <LogoFull />
          : props?.logoIcon ?? <LogoIcon />}
      </Link>
    </div>
  );
};

export const AppNav = createExtension({
  namespace: 'app',
  name: 'nav',
  attachTo: { id: 'app/layout', input: 'nav' },
  inputs: {
    items: createExtensionInput({
      target: createNavItemExtension.targetDataRef,
    }),
    logos: createExtensionInput(
      {
        elements: createNavLogoExtension.logoElementsDataRef,
      },
      {
        singleton: true,
        optional: true,
      },
    ),
  },
  output: {
    element: coreExtensionData.reactElement,
  },
  factory() {
    return {
      element: (
        <Sidebar>
          <SidebarLogo />
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarItem icon={SearchIcon} to="/search" text="Search" />
            <SidebarItem icon={HomeIcon} to="/" text="Home" />
            <SidebarItem icon={CategoryIcon} to="catalog" text="Catalog" />
            <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
            <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
            <SidebarItem icon={LiveHelpIcon} to="qeta" text="Q&A" />
            <SidebarItem icon={ReportingIcon} to="reporting" text="Reporting" />
            <SidebarDivider />
            <SidebarScrollWrapper>
              <SidebarItem icon={MapIcon} text="Tech Radars">
                <SidebarSubmenu title="Tech Radars">
                  {Radars.map((radar) => (
                    <SidebarSubmenuItem
                      icon={MapIcon}
                      to={`tech-radars/${radar.id}`}
                      title={radar.title}
                    />
                  ))}
                </SidebarSubmenu>
              </SidebarItem>
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarDivider />
          <SidebarItem icon={CreateIcon} to="/create" text="Create..." />
          <SidebarSpace />
          <SidebarDivider />
          <SidebarItem icon={SettingsIcons} to="settings" text="Settings" />
        </Sidebar>
      ),
    };
  },
});