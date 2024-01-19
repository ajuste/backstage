import { CatalogProcessor, CatalogProcessorEmit, processingResult } from '@backstage/plugin-catalog-node';

import {
  Entity,
  getCompoundEntityRef,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
} from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  ScmIntegrations,
  SingleInstanceGithubCredentialsProvider,
  GithubCredentials,
} from '@backstage/integration';
import {
  PluginEndpointDiscovery,
  TokenManager,
} from '@backstage/backend-common';
import { CatalogClient } from '@backstage/catalog-client';
import { Octokit } from "octokit";
import { Logger } from 'winston';
import { getPillarForEntity } from './githubEntityProvider'

const OwningRoles: string[] = ['maintain', 'admin'];

type Collaborator = {
  login: string;
  role_name: string;
}

type GithubRepo = {
  owner: string;
  repo: string;
}

type GetGithubRepoResponse = {
  name: string;
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
  private readonly discovery: PluginEndpointDiscovery;
  private readonly tokenManager: TokenManager;
  private readonly logger: Logger;

  getProcessorName(): string {
    return 'GithubProcessor';
  }

  constructor(config: Config, discovery: PluginEndpointDiscovery, tokenManager: TokenManager, logger: Logger) {
    this.config = config;
    this.discovery = discovery;
    this.tokenManager = tokenManager;
    this.logger = logger;
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
   * @param repo The repo
   * @returns A list of collaborators for a given repo
   */
  async getCollaborators(repo: GithubRepo): Promise<Collaborator[]> {

    const { token } = await this.getCredentials();
    const octokit = new Octokit({
      auth: token,
    })

    const result = await octokit.request('GET /repos/{owner}/{repo}/collaborators?affiliation=direct', {
      owner: repo.owner,
      repo: repo.repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    return result.data;
  }

  /**
   * Returns a list of repositories owned by a team.
   * 
   * @param repo The repo
   * @returns A list of repositories owned by a team
   */
  async getTeamOwnedRepos(team: string): Promise<GithubRepo[]> {

    const { token } = await this.getCredentials();
    const octokit = new Octokit({
      auth: token,
    })

    const PageSize = 100
    const allRepos: GetGithubRepoResponse[] = []
    let page = 1

    while (true) {
      const result = await octokit.request('GET /orgs/riskive/teams/{team}/repos?per_page={pageSize}&page={page}', {
        team: team,
        pageSize: PageSize,
        page: page++,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        }
      })
      if (result?.data) {
        allRepos.push(...result.data)
      }
      if (result?.data?.length !== PageSize) {
        break;
      }
    }
    return allRepos
      .map(({ name }) => {
        return { owner: 'riskive', repo: name }
      })
  }

  /**
   * Get entities that match the github repository slugs
   */
  async getEntitiesByRepos(repositories: GithubRepo[]): Promise<Entity[]> {

    if (!repositories || repositories.length == 0) {
      return []
    }
    const catalogClient = new CatalogClient({
      discoveryApi: this.discovery,
    });
    const { token } = await this.tokenManager.getToken();

    // Get all entities in parallel
    const getEntitiesPromises = repositories.map(({ owner, repo }) => catalogClient.getEntities(
      {
        filter: [{
          'metadata.annotations.github.com/project-slug': `${owner}/${repo}`,
        }],
      },
      { token },
    ));

    return (await Promise.all(getEntitiesPromises)).map(e => e.items).flat()
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
      this.logger.info(`Skipping entity ${entity.metadata.name} as it has no github.com/project-slug annotation`)
      throw new Error(
        `No github.com/project-slug annotation found for entity ${entity.metadata.name}`
      );
    }
    const [owner, repo] = slug ? slug.split('/') : [];

    // Get collaborators for the supporting-repo for this entity.
    const collaborators = await this.getCollaborators({ owner, repo });

    this.logger.info(`Found ${collaborators.length} collaborators for repo ${slug}`)
    collaborators
      .filter((collaborator) => OwningRoles.includes(collaborator.role_name))
      .forEach((collaborator) => {
        this.logger.info(`Setting collaborator ${collaborator.login} as owner of entity ${entity.metadata.name}`)
        emit(
          processingResult.relation({
            source: selfRef,
            type: RELATION_OWNER_OF,
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
   * Syncs up the entities owned by a team.
   * 
   * @param entity The entity to sync up owners for
   * @param emit The emit function
   * @returns The entity
   */
  async syncUpTeamOwnedEntities(entity: Entity, emit: CatalogProcessorEmit) {

    // Don't set pillar teams as owners of entities.
    if (this.isPillarTeam(entity)) {
      this.logger.info(`Skipping pillar team ${entity.metadata.name} as owner of entities`)
      return
    }

    // Get team's owner repositories from Github.
    const ownedRepos = (await this.getTeamOwnedRepos(entity.metadata.name))

    // Map repositories to Backstage entities.
    const ownedEntities = await this.getEntitiesByRepos(ownedRepos)

    this.logger.info(`Found ${ownedEntities.length} entities owned by team ${entity.metadata.name}`)

    // Emit relations.
    ownedEntities.forEach(ownedEntity => {
      this.logger.info(`Setting team ${entity.metadata.name} as owner of entity ${ownedEntity.metadata.name}`)

      emit(
        processingResult.relation({
          source: getCompoundEntityRef(entity),
          type: RELATION_OWNER_OF,
          target: getCompoundEntityRef(ownedEntity),
        }),
      );
      emit(
        processingResult.relation({
          source: getCompoundEntityRef(ownedEntity),
          type: RELATION_OWNED_BY,
          target: getCompoundEntityRef(entity),
        }),
      );
    });
  }

  /**
   * Syncs up the pillar to the entities owned by a pillar team.
   * 
   * @param entity The entity to sync up owners for
   * @param emit The emit function
   * @returns The entity
   */
  async setPillarToOwnedRepositories(entity: Entity, _: CatalogProcessorEmit) {

    if (!this.isPillarTeam(entity)) {
      this.logger.info(`Skipping non-pillar team ${entity.metadata.name} as owner of entities`)
      return
    }

    const catalogClient = new CatalogClient({
      discoveryApi: this.discovery,
    });

    const selfRef = getCompoundEntityRef(entity)
    const pillar = await getPillarForEntity(selfRef, catalogClient, this.logger)
    if (!pillar) {
      this.logger.warn(`Failed to pull pillar from ${selfRef.name} entity has no pillar defined`)
      return
    }

    if (!entity.metadata.annotations) {
      entity.metadata.annotations = {};
    }

    // Get team's owned repositories from Github.
    const ownedRepos = (await this.getTeamOwnedRepos(entity.metadata.name))

    // Map repositories to Backstage entities.
    const ownedEntities = await this.getEntitiesByRepos(ownedRepos)

    this.logger.info(`Found ${ownedEntities.length} entities owned by pillar team ${entity.metadata.name}`)

    ownedEntities.forEach(ownedEntity => {
      this.logger.info(`Setting pillar ${pillar} as pillar of entity ${ownedEntity.metadata.name}`)

      if (!ownedEntity.metadata.annotations) {
        ownedEntity.metadata.annotations = {};
      }
      ownedEntity.metadata.annotations['zerofox.com/pillar'] = pillar
    });
  }

  /**
   * Returns true if the entity is a team.
   * 
   * @param entity The entity to check
   * @returns True if the entity is a team
   */
  private isTeam(entity: Entity): boolean {
    return entity.kind === 'Group';
  }

  /**
   * Returns true if the entity is a pillar team.
   * 
   * @param entity The entity to check
   * @returns True if the entity is a pillar team
   */
  private isPillarTeam(entity: Entity): boolean {
    return entity.kind === 'Group' && entity.metadata?.name?.endsWith('-pillar');
  }


  private isGithubAPI(location: LocationSpec): boolean {
    const githubUrlRegex = /^https:\/\/github\.com\/orgs\/([^\/]+)\/teams\/([^\/]+)$/;
    return location.type == "url" && githubUrlRegex.exec(location.target) !== null;
  }

  // Run after validateEntityKind
  async postProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {

    if (this.canSyncUpOwnersOfEntity(entity)) {
      await this.syncUpOwnersOfEntity(entity, emit);
    }

    if (this.isTeam(entity) && this.isGithubAPI(location)) {
      await this.syncUpTeamOwnedEntities(entity, emit);
    }

    if (this.isPillarTeam(entity) && this.isGithubAPI(location)) {
      await this.setPillarToOwnedRepositories(entity, emit);
    }

    return entity;
  }
}
