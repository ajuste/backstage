import { createDevApp } from '@backstage/dev-utils';
import { githubResourceFetcherPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(githubResourceFetcherPlugin)