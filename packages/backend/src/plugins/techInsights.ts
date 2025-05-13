import { Operator } from 'json-rules-engine';
import semver from 'semver';
import {
  JsonRulesEngineFactCheckerFactory,
  JSON_RULE_ENGINE_CHECK_TYPE,
} from '@backstage-community/plugin-tech-insights-backend-module-jsonfc';
import {
  techInsightsFactCheckerFactoryExtensionPoint,
  techInsightsFactRetrieversExtensionPoint,
} from '@backstage-community/plugin-tech-insights-node';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  getGithubFactRetriever,
  getOwnershipFactRetriever,
} from '@internal/plugin-zf-tech-insights-backend';

export const techInsightsExtensions = createBackendModule({
  pluginId: 'tech-insights',
  moduleId: 'tech-insights-facts',
  register(env) {
    env.registerInit({
      deps: {
        factCheckerFactory: techInsightsFactCheckerFactoryExtensionPoint,
        factRetrievers: techInsightsFactRetrieversExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ factCheckerFactory, factRetrievers, logger }) {
        if (
          process.env.NOMAD_ALLOC_INDEX === '0' ||
          !process.env.env ||
          process.env.env == 'local'
        ) {
          factRetrievers.addFactRetrievers(factRetrieversCatalog);
        }
        factCheckerFactory.setFactCheckerFactory(
          new JsonRulesEngineFactCheckerFactory({ operators, logger, checks }),
        );
      },
    });
  },
});

const factRetrieversCatalog = {
  githubFactRetriever: getGithubFactRetriever(),
  ownershipFactRetriever: getOwnershipFactRetriever(),
};

const operators = [
  new Operator('semverGraterThan', (factValue: any, jsonValue: any) => {
    return semver.gt(factValue, jsonValue);
  }),
  new Operator('semverGraterThanEquals', (factValue: any, jsonValue: any) => {
    return semver.gte(factValue, jsonValue);
  }),
  new Operator('semverLesserThan', (factValue: any, jsonValue: any) => {
    return semver.lt(factValue, jsonValue);
  }),
  new Operator('semverLesserThanEquals', (factValue: any, jsonValue: any) => {
    return semver.lte(factValue, jsonValue);
  }),
  new Operator('semverEquals', (factValue: any, jsonValue: any) => {
    return semver.eq(factValue, jsonValue);
  }),
];

const checks = [
  {
    id: 'staleRepoCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'Stale repo check',
    description: 'Verifies if an entity repository is stale',
    factIds: ['githubFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'msSinceLastCommit',
            operator: 'lessThan',
            value: 6 * 30 * 24 * 60 * 60 * 1000,
          },
        ],
      },
    },
  },
  {
    id: 'techDebtRatioCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'Tech debt ratio check',
    description: 'Verifies if an entity has a tech debt ratio',
    factIds: ['githubFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'techDebtRatio',
            operator: 'greaterThan',
            value: 0.1,
          },
        ],
      },
    },
  },
  {
    id: 'terraformVersionCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'Terraform version check',
    description:
      'Verifies if an entity is using a unsupported Terraform version by DevOps',
    factIds: ['githubFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'terraformVersion',
            operator: 'semverGraterThanEquals',
            value: '0.12.0',
          },
        ],
      },
    },
  },
  {
    id: 'ownershipCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'Ownership check',
    description: 'Verifies if an entity repository has proper ownership',
    factIds: ['ownershipFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'hasPillar',
            operator: 'equal',
            value: true,
          },
          {
            fact: 'hasTeamOwner',
            operator: 'equal',
            value: true,
          },
          {
            fact: 'hasUserOwner',
            operator: 'equal',
            value: true,
          },
        ],
      },
    },
  },
];
