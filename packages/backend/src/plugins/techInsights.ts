import {
  createRouter,
  buildTechInsightsContext,
  createFactRetrieverRegistration,
  entityOwnershipFactRetriever,
  entityMetadataFactRetriever,
  techdocsFactRetriever,
} from '@backstage/plugin-tech-insights-backend';
import { getGithubFactRetriever } from '@internal/plugin-zf-tech-insights-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
  JsonRulesEngineFactCheckerFactory,
  JSON_RULE_ENGINE_CHECK_TYPE,
} from '@backstage/plugin-tech-insights-backend-module-jsonfc';
import {
  Operator,
} from 'json-rules-engine';
import semver from 'semver';

const ttlTwoWeeks = { timeToLive: { weeks: 2 } };

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const techInsightsContext = await buildTechInsightsContext({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    scheduler: env.scheduler,
    factRetrievers:
      process.env.NOMAD_ALLOC_INDEX !== '0'
        ? []
        : [
          createFactRetrieverRegistration({
            cadence: '0 1 * * *',
            factRetriever: entityOwnershipFactRetriever,
            lifecycle: ttlTwoWeeks,
          }),
          createFactRetrieverRegistration({
            cadence: '0 2 * * *',
            factRetriever: entityMetadataFactRetriever,
            lifecycle: ttlTwoWeeks,
          }),
          createFactRetrieverRegistration({
            cadence: '0 3 * * *',
            factRetriever: techdocsFactRetriever,
            lifecycle: ttlTwoWeeks,
          }),
          createFactRetrieverRegistration({
            cadence: '0 4/16 * * *',
            factRetriever: getGithubFactRetriever(),
            lifecycle: ttlTwoWeeks,
          }),
        ],
    factCheckerFactory: new JsonRulesEngineFactCheckerFactory({
      operators: [
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
      ],
      logger: env.logger,
      checks: [
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
        {
          id: 'outdatedInfraToolsCheck',
          type: JSON_RULE_ENGINE_CHECK_TYPE,
          name: 'Outdated infrastructure tools',
          description: 'Verifies if an entity is using outdated infrastructure tools',
          factIds: ['githubFactRetriever'],
          rule: {
            conditions: {
              all: [
                {
                  fact: 'terraformVersion',
                  operator: 'semverGraterThanEquals',
                  value: "0.11.15",
                },
              ],
            },
          },
        },
      ],
    }),
  });

  return await createRouter({
    ...techInsightsContext,
    logger: env.logger,
    config: env.config,
  });
}
