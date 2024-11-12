import { legacyPlugin } from '@backstage/backend-common';
import { createBackend } from '@backstage/backend-defaults';
import { techInsightsExtensions } from './plugins/techInsights'

async function main() {
  const backend = createBackend()

  // Logging
  backend.add(import('./plugins/logging'));

  // App framework
  backend.add(import('@backstage/plugin-app-backend/alpha'));

  // Auth
  backend.add(import('@backstage/plugin-auth-backend'));
  backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

  // Proxy
  backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
  backend.add(legacyPlugin('proxy', import('./plugins/proxy')));

  // Catalog
  backend.add(import('@backstage/plugin-catalog-backend/alpha'));
  if (process.env.NOMAD_ALLOC_INDEX === '0' || !process.env.env ||  process.env.env == 'local' ) {
    backend.add(import('./modules/githubOrgProviderTransformers'));
  }
  backend.add(import('@backstage/plugin-catalog-backend-module-github/alpha'));
  backend.add(import('@backstage/plugin-catalog-backend-module-github-org'));

  // Search
  backend.add(import('@backstage/plugin-search-backend/alpha'));
  backend.add(import('@backstage/plugin-search-backend-module-explore/alpha'));
  backend.add(import('@backstage/plugin-search-backend-module-pg/alpha'))
  backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
  backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));

  // Scaffold
  backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
  backend.add(
    import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
  );
  backend.add((await import('./plugins/scaffolder')).scaffolderCustomActions);
  backend.add(import('@backstage/plugin-scaffolder-backend-module-github'))

  // Auth
  backend.add(import('@backstage/plugin-permission-backend/alpha'));
  backend.add(
    import('@backstage/plugin-permission-backend-module-allow-all-policy'),
  );

  // Techinsights
  backend.add(import('@backstage-community/plugin-tech-insights-backend'));
  backend.add(import("@internal/plugin-zf-tech-insights-backend"));
  backend.add(techInsightsExtensions);

  // Docs
  backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

  // Coverage
  backend.add(legacyPlugin('code-coverage', import('./plugins/codecoverage')));

  // Reporting
  backend.add(import('@internal/plugin-reporting-backend'));

  // Q&A
  backend.add(import('@drodil/backstage-plugin-qeta-backend'));
  backend.add(import('@drodil/backstage-plugin-search-backend-module-qeta'));

  // Github resource fetcher
  backend.add(legacyPlugin('github-resource-fetcher', import('./plugins/githubResourceFetcher')));

  // Badges
  //backend.add(import('@backstage-community/plugin-badges-backend'));
  backend.add(legacyPlugin('badges', import('./plugins/badges')));

  // Nomad
  backend.add(legacyPlugin('nomad', import('./plugins/nomad')));
  backend.add(legacyPlugin('rag-ai', import('./plugins/ia')));

  return backend.start();
}

module.hot?.accept();
main().catch(error => {
  console.error('Backend failed to start up', error);
  process.exit(1);
});