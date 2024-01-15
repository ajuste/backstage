import { CatalogProcessor, CatalogProcessorEmit, processingResult } from '@backstage/plugin-catalog-node';

import {
  Entity,
  getCompoundEntityRef,
  RELATION_OWNED_BY,
} from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  ScmIntegrations,
  SingleInstanceGithubCredentialsProvider,
  GithubCredentials,
} from '@backstage/integration';
import { Octokit } from "octokit";

const OwningRoles: string[] = ['maintain', 'admin'];

type Collaborator = {
  login: string;
  role_name: string;
}

/*
 * Define owner relationships
 *
 * Any user that is set to "Maintain" or "Admin" a repository is deemed a Service Owner
 *
 * Any pillar team that is set to "Write" a repository is deemed a Service Owner
 */
export class GithubProcessor implements CatalogProcessor {
  private readonly config: Config;

  getProcessorName(): string {
    return 'GithubProcessor';
  }

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Returns the credentials for the GitHub integration.
   * 
   * @returns The credentials for the GitHub integration
   */
  async getCredentials(): Promise<GithubCredentials> {
    const integrations = ScmIntegrations.fromConfig(this.config);
    const ghIntegration = integrations.github.byHost("github.com");

    if (!ghIntegration) {
      throw new Error(
        'No GitHub integration config found, please add config',
      );
    }
    const ghCredentialsProvider = SingleInstanceGithubCredentialsProvider.create(ghIntegration.config);
    const ghHost = ghIntegration.config.host;
    const orgUrl = `https://${ghHost}/riskive`;

    return await ghCredentialsProvider.getCredentials({
      url: orgUrl,
    });
  }

  // Run first
  async preProcessEntity(
    entity: Entity,
  ): Promise<Entity> {
    return entity;
  }

  // Run after preProcess
  async validateEntityKind(_: Entity): Promise<boolean> {
    // Return true if entity kind and it's fields are valid
    // and can be processed by this processor. Return false if the entity 
    // cannot be processed with this processor. Throw error if the entity
    // is invalid.
    return true;
  }

  /**
   * Returns a list of collaborators for a given repo.
   * 
   * @param owner The owner of the repo
   * @param repoName The name of the repo
   * @returns A list of collaborators for a given repo
   */
  async getCollaborators(owner: string, repoName: string): Promise<Collaborator[]> {

    const { token } = await this.getCredentials();
    const octokit = new Octokit({
      auth: token,
    })

    //TODO: paginate through all collaborators.
    const result = await octokit.request('GET /repos/{owner}/{repo}/collaborators', {
      owner: owner,
      repo: repoName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    return result.data;
  }

  /**
   * Syncs up the owners of the entity.
   * 
   * @param entity The entity to sync up owners for
   * @param emit The emit function
   * @returns The entity
   * @throws Error if the entity has no github.com/project-slug annotation
   */
  async syncUpOwnersOfEntity(entity: Entity, emit: CatalogProcessorEmit) {

    const selfRef = getCompoundEntityRef(entity);
    const slug = entity.metadata.annotations?.['github.com/project-slug'];
    if (!slug) {
      throw new Error(
        `No github.com/project-slug annotation found for entity ${entity.metadata.name}`
      );
    }
    const [owner, repo] = slug ? slug.split('/') : [];

    // Get collaborators for the supporting-repo for this entity.
    const collaborators = await this.getCollaborators(owner, repo);

    collaborators
      .filter((collaborator) => OwningRoles.includes(collaborator.role_name))
      .forEach((collaborator) => {
        emit(
          processingResult.relation({
            source: selfRef,
            type: RELATION_OWNED_BY,
            target: {
              kind: 'User',
              namespace: 'default',
              name: collaborator.login,
            },
          }),
        );
      });
  }

  /**
   * Returns true if the entity can be synced up with owners.
   * 
   * @param entity The entity to check
   * @returns True if the entity can be synced up with owners
   */
  canSyncUpOwnersOfEntity(entity: Entity): boolean {
    return !!entity.metadata.annotations?.['github.com/project-slug'];
  }

  /**
   * Returns true if the entity is a team.
   * 
   * @param entity The entity to check
   * @returns True if the entity is a team
   */
  isTeam(entity: Entity): boolean {
    return entity.kind === 'Group';
  }

  // Run after validateEntityKind
  async postProcessEntity(
    entity: Entity,
    _: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {

    if (this.canSyncUpOwnersOfEntity(entity)) {
      await this.syncUpOwnersOfEntity(entity, emit);
    }

    // if (this.isTeam(entity)) {
    //   let name = entity.metadata.name;
    //   if (selfRef.name.includes('team-') && selfRef.name === 'team-impersonation') {
    //     console.log('the impersonation team');
    //     console.log(selfRef);
    //     console.log(entity);
    //     console.log(processingResult);
    //     let source: CompoundEntityRef = {
    //       kind: entity.kind,
    //       namespace: entity.metadata.namespace,
    //       name: entity.metadata.name,
    //     };

    //     const octokit = new Octokit({
    //       auth: this.token,
    //     })
    //     const result = await octokit.request('GET /orgs/riskive/teams/{team-slug}/repos', {
    //       'team-slug': selfRef.name,
    //       headers: {
    //         'X-GitHub-Api-Version': '2022-11-28'
    //       }
    //     })

    //     for (var repo of result.data) {
    //       console.log(repo);
    //       if (repo.role_name === 'write') {
    //         console.log('emitting ownership for GROUP');
    //         console.log(selfRef);
    //         console.log(repo.name);
    //         emit(
    //           processingResult.relation({
    //             source: selfRef,
    //             type: RELATION_OWNER_OF,
    //             target: {
    //               kind: 'System',
    //               namespace: 'default',
    //               name: repo.name,
    //             },
    //           }),
    //         );
    //         emit(
    //           processingResult.relation({
    //             source: {
    //               kind: 'System',
    //               namespace: 'default',
    //               name: repo.name,
    //             },
    //             type: RELATION_OWNED_BY,
    //             target: selfRef,
    //           }),
    //         );
    //       }
    //     }
    //   }
    // }
    return entity;
  }
}
