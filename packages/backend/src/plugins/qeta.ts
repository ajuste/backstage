import {
    createRouter,
    DatabaseQetaStore,
  } from '@drodil/backstage-plugin-qeta-backend';
  import { PluginEnvironment } from '../types';
  
  export default async function createPlugin({
    logger,
    database,
    identity,
    config,
  }: PluginEnvironment) {
    const db = await DatabaseQetaStore.create({
      database: database,
    });
    return createRouter({
      logger,
      database: db,
      identity,
      config,
    });
  }