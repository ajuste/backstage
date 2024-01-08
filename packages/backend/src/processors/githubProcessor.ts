// packages/backend/src/processors/githubProcessor.ts
import { CatalogProcessor, CatalogProcessorEmit, processingResult } from '@backstage/plugin-catalog-node';

import {
  Entity,
  getCompoundEntityRef,
  CompoundEntityRef,
  RELATION_OWNER_OF,
  RELATION_OWNED_BY,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import { Octokit } from "octokit";

/*
 * Define owner relationships
 *
 * Any user that is set to "Maintain" or "Admin" a repository is deemed a Service Owner
 *
 * Any pillar team that is set to "Write" a repository is deemed a Service Owner
 */
export class GithubProcessor implements CatalogProcessor {
  private readonly token: string
  getProcessorName(): string {
    return 'GithubProcessor';
  }

  constructor(token: string) {
    this.token = token;
  }

  // Run first
  async preProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
    originLocation: LocationSpec,
  ): Promise<Entity> {
    return entity;
  }

  // Run after preProcess
  async validateEntityKind(entity: Entity): Promise<boolean> {
    // Return true if entity kind and it's fields are valid
    // and can be processed by this processor. Return false if the entity 
    // cannot be processed with this processor. Throw error if the entity
    // is invalid.
    return true;
  }

  // Run after validateEntityKind
  async postProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    // return entity;
    const selfRef = getCompoundEntityRef(entity);
    if (entity.kind === 'System') {
      // Assuming Pillar team, make API call for team repos, then emit relations that they own those repos
      // TODO could add Github API call to fetch team repos
      // let token = env.config.config.data.integrations.github[0].token

      const octokit = new Octokit({
        auth: this.token,
      })

      const result = await octokit.request('GET /repos/riskive/{repo}/collaborators', {
        repo: selfRef.name,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
      
      for (var user of result.data) {
        if (user.role_name === 'maintain' || user.role_name === 'admin') {
          console.log('emitting ownership for SYSTEM');
          console.log(selfRef);
          console.log(user);
          emit(
            processingResult.relation({ 
              source: selfRef,
              type: RELATION_OWNED_BY,
              target: {
                kind: 'User',
                namespace: 'default',
                name: user.login,
              },
            }),
          );
        }
      }
    }

    if (selfRef.kind === 'Group') {
      let name = entity.metadata.name;
      if (selfRef.name.includes('team-') && selfRef.name === 'team-impersonation') {
        console.log('the impersonation team');
        console.log(selfRef);
        console.log(entity);
        console.log(processingResult);
        let source: CompoundEntityRef = {
            kind: entity.kind,
            namespace: entity.metadata.namespace,
            name: entity.metadata.name, 
        };

        const octokit = new Octokit({
          auth: this.token,
        })
        const result = await octokit.request('GET /orgs/riskive/teams/{team-slug}/repos', {
          'team-slug': selfRef.name,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
        
        for (var repo of result.data) {
          console.log(repo);
          if (repo.role_name === 'write') {
            console.log('emitting ownership for GROUP');
            console.log(selfRef);
            console.log(repo.name);
            emit(
              processingResult.relation({ 
                source: selfRef,
                type: RELATION_OWNER_OF,
                target: {
                  kind: 'System',
                  namespace: 'default',
                  name: repo.name,
                },
              }),
            );
            emit(
              processingResult.relation({ 
                source: {
                  kind: 'System',
                  namespace: 'default',
                  name: repo.name,
                },
                type: RELATION_OWNED_BY,
                target: selfRef,
              }),
            );
          }
        }
      }
    }
    return entity;
  }
}
