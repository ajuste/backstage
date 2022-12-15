import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { githubResourceFetcherPlugin, GithubResourceFetcherPage } from '../src/plugin';

createDevApp()
  .registerPlugin(githubResourceFetcherPlugin)
  .addPage({
    element: <GithubResourceFetcherPage />,
    title: 'Root Page',
    path: '/github-resource-fetcher'
  })
  .render();
