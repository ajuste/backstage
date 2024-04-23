import { createRouter } from '@backstage-community/plugin-nomad-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  props: PluginEnvironment,
): Promise<Router> {
  return await createRouter(props);
}