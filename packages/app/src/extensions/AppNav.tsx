import React from 'react';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import MapIcon from '@material-ui/icons/MyLocation';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import ReportingIcon from '@material-ui/icons/Assessment';
import CategoryIcon from '@material-ui/icons/Category';
import CreateIcon from '@material-ui/icons/MapRounded';
import SettingsIcons from '@material-ui/icons/Settings';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import ScoreIcon from '@material-ui/icons/Score';
import RDSIcon from '@material-ui/icons/Storage';

import {
  compatWrapper,
} from '@backstage/core-compat-api';

import {
  createExtension,
  coreExtensionData,
  createExtensionInput,
  createNavItemExtension,
  createNavLogoExtension,
  createComponentExtension,
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
import { RagModal, SidebarRagModal} from './AIAssistant';

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
    globals: createExtensionInput({
      target: createComponentExtension.componentDataRef
    }),
  },
  output: {
    element: coreExtensionData.reactElement,
  },
  factory({ inputs }) {
    return {
      element: (
        <Sidebar>
          <SidebarLogo />
          <SidebarDivider />
          {compatWrapper(<RagModal />)}
          
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarItem icon={SearchIcon} to="/search" text="Search" />
            <SidebarItem icon={HomeIcon} to="/" text="Home" />
            <SidebarItem icon={CategoryIcon} to="catalog" text="Catalog" />
            <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
            <SidebarItem icon={RDSIcon} to="databases" text="Databases" />
            <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
            <SidebarItem icon={LiveHelpIcon} to="qeta" text="Q&A" />
            <SidebarItem icon={ReportingIcon} to="reporting" text="Reporting" />
            <SidebarItem icon={ScoreIcon} to="score-board" text="Service Assessment" />

            {inputs.globals.map(item => {
              return <li>{<item.output.target.impl />}</li>;
            })}
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
          <SidebarItem icon={CreateIcon} to="/create" text="Golden paths" />
          {compatWrapper(<SidebarRagModal />)}
          <SidebarSpace />
          <SidebarDivider />
          <SidebarItem icon={SettingsIcons} to="settings" text="Settings" />
        </Sidebar>
      ),
    };
  },
});