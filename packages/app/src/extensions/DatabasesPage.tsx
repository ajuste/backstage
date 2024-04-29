import {
  createPlugin,
  createRouteRef,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

const rdsRouteRef = createRouteRef({
  id: "rds-catalog",
});

export const databaseCatalogPlugin = createPlugin({
  id: 'database-catalog',
  routes: {
    rds: rdsRouteRef,
  },
});

export const RDSDatabasePage = databaseCatalogPlugin.provide(
  createRoutableExtension({
    name: "RDSDatabasePage",
    component: () => import('../components/catalog/DatabaseCatalogPage').then(m => m.DatabaseCatalogPage),
    mountPoint: rdsRouteRef,
  }),
);