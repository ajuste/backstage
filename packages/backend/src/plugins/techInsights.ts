
import { Operator } from 'json-rules-engine';
import semver from 'semver';
import { entityOwnershipFactRetriever, entityMetadataFactRetriever, techdocsFactRetriever }  from '@backstage-community/plugin-tech-insights-backend';
import { JsonRulesEngineFactCheckerFactory, JSON_RULE_ENGINE_CHECK_TYPE } from '@backstage-community/plugin-tech-insights-backend-module-jsonfc';
import { techInsightsFactCheckerFactoryExtensionPoint, techInsightsFactRetrieversExtensionPoint } from '@backstage-community/plugin-tech-insights-node';
import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { getGithubFactRetriever } from '@internal/plugin-zf-tech-insights-backend';

export const techInsightsExtensions = createBackendModule({
  pluginId: 'tech-insights',
  moduleId: 'tech-insights-facts',
  register(env) {
    env.registerInit({
      deps: {
        factCheckerFactory: techInsightsFactCheckerFactoryExtensionPoint, //
        factRetrievers: techInsightsFactRetrieversExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ factCheckerFactory, factRetrievers, logger }) {
        if (process.env.NOMAD_ALLOC_INDEX === '0' || !process.env.env ||  process.env.env == 'local' ) {
          factRetrievers.addFactRetrievers(factRetrieversCatalog);
        }
        factCheckerFactory.setFactCheckerFactory(new JsonRulesEngineFactCheckerFactory({ operators, logger, checks }));
      },
    });
  },
});

const factRetrieversCatalog = {
  "entityOwnershipFactRetriever": entityOwnershipFactRetriever,
  "entityMetadataFactRetriever": entityMetadataFactRetriever,
  "techdocsFactRetriever": techdocsFactRetriever,
  "githubFactRetriever": getGithubFactRetriever(),
}

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
]

const checks = [
  {
    id: 'groupOwnerCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'Group Owner Check',
    description:
      'Verifies that a Group has been set as the owner for this entity',
    factIds: ['entityOwnershipFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'hasGroupOwner',
            operator: 'equal',
            value: true,
          },
        ],
      },
    },
  },
  {
    id: 'titleCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'Title Check',
    description:
      'Verifies that a Title, used to improve readability, has been set for this entity',
    factIds: ['entityMetadataFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'hasTitle',
            operator: 'equal',
            value: true,
          },
        ],
      },
    },
  },
  {
    id: 'techDocsCheck',
    type: JSON_RULE_ENGINE_CHECK_TYPE,
    name: 'TechDocs Check',
    description:
      'Verifies that TechDocs has been enabled for this entity',
    factIds: ['techdocsFactRetriever'],
    rule: {
      conditions: {
        all: [
          {
            fact: 'hasAnnotationBackstageIoTechdocsRef',
            operator: 'equal',
            value: true,
          },
        ],
      },
    },
  },
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
];