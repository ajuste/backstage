import { CatalogProcessor, CatalogProcessorEmit, processingResult, CatalogProcessorCache } from '@backstage/plugin-catalog-node';

import {
  Entity,
  getCompoundEntityRef,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  stringifyEntityRef,
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
import { getPillarForEntity, isFeatureTeam } from './githubEntityProvider'

const Pillars: Record<string, { value: string, grafana: string, githubName: string }> = {
  'attacksurface': {
    value: 'Attack Surface',
    grafana: 'attack surface',
    githubName: 'attacksurface-pillar',
  },
  'disruption': {
    value: 'Disruption',
    grafana: 'disruption',
    githubName: 'disruption-pillar',
  },
  'intelligence': {
    value: 'Intelligence',
    grafana: 'intelligence',
    githubName: 'intelligence-pillar',
  },
  'protection': {
    value: 'Protection',
    grafana: 'protection',
    githubName: 'protection-pillar',
  },
  'response': {
    value: 'Response',
    grafana: 'response',
    githubName: 'response-pillar',
  },
  'sustaining': {
    value: 'Sustaining',
    grafana: 'sustaining',
    githubName: 'sustaining-pillar',
  },
  'datascience': {
    value: 'Data Science',
    grafana: 'data-science',
    githubName: 'data-science-pillar',
  },
  'foxteam': {
    value: 'FoxTeam',
    grafana: 'fox-team',
    githubName: 'fox-team-pillar',
  },
};

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
      .filter(({ role_name }) => role_name === 'write')
      .map(({ name }) => {
        return { owner: 'riskive', repo: name }
      })
  }

  async getEntityFromCatalog(entity: Entity): Promise<Entity | undefined> {
    const catalogClient = new CatalogClient({
      discoveryApi: this.discovery,
    });
    const { token } = await this.tokenManager.getToken();
    const entityRef = stringifyEntityRef(entity);
    const res = await catalogClient.getEntityByRef(entityRef, { token })
    return res
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
        const userRef = { kind: 'User', namespace: 'default', name: collaborator.login }
        emit(
          processingResult.relation({
            source: selfRef,
            type: RELATION_OWNED_BY,
            target: userRef,
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
   * Emits the pillar to the entities owned by a pillar team.
   * 
   */
  async emitPillar(entity: Entity, emit: CatalogProcessorEmit) {

    if (!this.isPillarTeam(entity)) {
      this.logger.info(`Skipping non-pillar team ${entity.metadata.name} so it won't be emitted`)
      return
    }

    let pillarName = Object.keys(Pillars).find((pillar: string) => {
      return Pillars[pillar].githubName === entity.metadata.name
    })

    if (!pillarName) {
      pillarName = entity.metadata.name.replaceAll('-pillar', '')
      this.logger.warn(`Pillar not found for ${entity.metadata.name}, using name as pillar ${pillarName}`)
    }
    let pillar = Pillars[pillarName.toLowerCase()]

    if (!pillar) {
      pillar = {
        value: entity.metadata.name.replaceAll('-pillar', ''),
        grafana: entity.metadata.name.replaceAll('-pillar', ''),
        githubName: entity.metadata.name
      };
    }

    const pillarEntity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: entity.metadata.name,
        description: entity.metadata.description,
        annotations:
        {
          'zerofox.com/pillar': pillar.value,
          'grafana/tag-selector': pillar.grafana,
        },
      },
      spec: {
        type: 'pillar',
        lifecycle: 'production',
        owner: 'noowner',
      },
    }
    const pillarLocation = {
      type: "url",
      target: `github.com/orgs/riskive/teams/${entity.metadata.name}`
    }
    this.logger.info(`Emitting pillar ${entity.metadata.name} as pillar of entities`)
    emit(processingResult.entity(pillarLocation, pillarEntity))
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

  /**
   * Returns true if the location is a catalog file.
   * @param location The location
   * @returns True if the location is a catalog file
   */
  private isFromCatalogFile(location: LocationSpec): boolean {
    return location.type == "url" && (
      location.target.endsWith(".yaml") ||
      location.target.endsWith(".yml")
    );
  }

  /**
   * Returns true if the entity has an owner set by a catalog file.
   * 
   * @param entity The entity to check
   * @returns True if the entity has an owner set by a catalog file
   */
  private hasOwnerSetByCatalogFile(entity: Entity): boolean {
    return !!entity.spec?.owner
  }

  private async overrideCatalogOwner(entity: Entity): Promise<Entity> {
    if (!this.hasOwnerSetByCatalogFile(entity)) {
      this.logger.info(`Skipping overriding catalog owner from catalog for entity ${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name} as it has no owner set by a catalog file`)
      return entity;
    }
    const catalogEntity = await this.getEntityFromCatalog(entity);
    const catalogOwner = String(entity.spec?.owner)

    // Find out if the entity has owners that are different
    // from the ones set by the catalog file. that means that
    // the owners are coming from somwhere else (ie github).
    // In that case, we want to override owner with the first
    // owner coming from outside.
    this.logger.info(`Got catalogOwner: ${catalogOwner} ${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name} ${entity.spec?.owner} ${catalogEntity?.relations?.map(r => r.targetRef + " " + r.type).join(", ")}`) // eslint-disable-line no-console
    const hasOwnersFromOutsideCatalog = catalogEntity?.relations?.filter(
      relation => relation.type === RELATION_OWNED_BY &&
        !relation.targetRef.endsWith(catalogOwner)
    )

    let shouldOverrideOwner = false

    if (!hasOwnersFromOutsideCatalog?.length) {
      this.logger.info(`Skipping overriding catalog owner from catalog for entity ${entity.metadata.namespace ?? 'default'}/${entity.kind}/${entity.metadata.name} as it has the same owner set by the catalog file ${catalogOwner}`)
    } else {
      // if the owner is a group and is coming from GitHub,
      // double check it the team owns the repo (border case
      // when unsetting a team as owner of a repo)
      if (entity.kind == 'Group' && entity.metadata.annotations?.["github.com/team-slug"]) {
        const ownerRepos = await this.getTeamOwnedRepos(entity.metadata.name);
        if (!ownerRepos.find(repo => repo.repo == entity.metadata.annotations?.["github.com/team-slug"].split("/")[1])) {
          this.logger.info(`Skipping overriding catalog owner from catalog for entity ${entity.metadata.namespace ?? 'default'}/${entity.kind}/${entity.metadata.name} as the team ${entity.metadata.name} does not own the repo ${entity.metadata.annotations?.["github.com/team-slug"]}`)
        }
      } else {
        shouldOverrideOwner = true
      }
    }
    if (shouldOverrideOwner) {
      this.logger.info(`Overriding catalog owner from file for entity ${entity.metadata.namespace ?? 'default'}/${entity.kind}/${entity.metadata.name} with ${hasOwnersFromOutsideCatalog?.map(o => o?.targetRef).join(", ")} owners that are not set by the catalog file ${catalogOwner}`)
      if (!entity.spec) {
        entity.spec = {}
      }
      entity.spec.owner = hasOwnersFromOutsideCatalog?.[0].targetRef
    }
    return entity;
  }

  /**
   * Pre-processes the entity.
   * 
   * @param entity - The (possibly partial) entity to process
   * @param location - The location that the entity came from
   * @param emit - A sink for auxiliary items resulting from the processing
   * @param originLocation - The location that the entity originally came from.
   * @returns The entity
   */
  async preProcessEntity(entity: Entity, location: LocationSpec, _2: CatalogProcessorEmit, originLocation: LocationSpec, _3: CatalogProcessorCache): Promise<Entity> {

    if ((this.isFromCatalogFile(originLocation) || this.isFromCatalogFile(location)) && this.hasOwnerSetByCatalogFile(entity)) {
      entity = await this.overrideCatalogOwner(entity);
    } else {
      this.logger.info(`Skipping entity ${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name} as it has no owner set by a catalog file ${originLocation?.target} ${location?.target}`)
    }
    return entity
  }

  // Run after validateEntityKind
  async postProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {

    this.logger.debug(`Starting post process entity for ${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name}`)

    if (this.canSyncUpOwnersOfEntity(entity)) {
      await this.syncUpOwnersOfEntity(entity, emit);
    }

    if (isFeatureTeam(entity) && this.isGithubAPI(location)) {
      await this.syncUpTeamOwnedEntities(entity, emit);
    }

    if (this.isPillarTeam(entity) && this.isGithubAPI(location)) {
      await this.emitPillar(entity, emit);
      await this.setPillarToOwnedRepositories(entity, emit);
    }

    return entity;
  }
}
