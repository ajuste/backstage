import { createDevApp } from '@backstage/dev-utils';
import { awsResourceFetcherPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(awsResourceFetcherPlugin)
  .render();
