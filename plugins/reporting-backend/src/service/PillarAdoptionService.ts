import { ConfigApi } from '@backstage/core-plugin-api';
import { SingleInstanceGithubCredentialsProvider } from '@backstage/integration';
import { ScmIntegrations, GithubCredentials } from '@backstage/integration';
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { Logger } from 'winston';
import {
  PillarAdoptionReport,
  PillarAdoptionServiceAPI,
} from '@internal/plugin-reporting-common';
import { TokenManager } from '@backstage/backend-common';
import { CatalogClient, GetEntitiesResponse } from '@backstage/catalog-client';
import {
  Entity,
  GroupEntity,
  UserEntity,
  stringifyEntityRef,
} from '@backstage/catalog-model';

import { ZFCatalogAPI } from 'backstage-plugin-zf-tech-insights-common';

type RepoAdoptionAnalysis = {
  repo: string;
  entities: Entity[];
  hasPillar: boolean;
  owner: Entity | undefined;
  ownerInPillar: boolean;
};

const DaysThreshold = 180;

type Commit =
  RestEndpointMethodTypes['repos']['listCommits']['response']['data'][0];
type Repo =
  RestEndpointMethodTypes['repos']['listForOrg']['response']['data'][0];
type CommitsPerRepo = [Repo, Commit[]];

export default class PillarAdoptionService implements PillarAdoptionServiceAPI {
  private config: ConfigApi;
  private logger: Logger;
  private catalogClient: CatalogClient;
  private tokenManager: TokenManager;
  private zfCatalogService: ZFCatalogAPI;

  constructor(
    config: ConfigApi,
    logger: Logger,
    catalogClient: CatalogClient,
    tokenManager: TokenManager,
    zfCatalogService: ZFCatalogAPI,
  ) {
    this.config = config;
    this.logger = logger;
    this.catalogClient = catalogClient;
    this.tokenManager = tokenManager;
    this.zfCatalogService = zfCatalogService;
  }

  protected async getGithubCredentials(): Promise<GithubCredentials> {
    const integrations = ScmIntegrations.fromConfig(this.config);
    const ghIntegration = integrations.github.byHost('github.com');

    if (!ghIntegration) {
      throw new Error('No GitHub integration config found, please add config');
    }
    const ghCredentialsProvider =
      SingleInstanceGithubCredentialsProvider.create(ghIntegration.config);

    const host = ghIntegration.config.host;
    const orgUrl = `https://${host}/riskive`;

    return await ghCredentialsProvider.getCredentials({
      url: orgUrl,
    });
  }

  protected async listAllGithubRepos(
    excludedRepos: string[],
  ): Promise<string[]> {
    const { headers } = await this.getGithubCredentials();

    const octokit = new Octokit({
      auth: headers?.Authorization,
    });

    const pageSize = 100;
    let page = 1;
    let repos: string[] = [];

    while (true) {
      const { data } = await octokit.repos.listForOrg({
        org: 'riskive',
        per_page: pageSize,
        page: page,
      });

      const commitsPerRepo = await Promise.all(
        data
          .filter(repo => !repo.archived)
          .filter(repo => !excludedRepos.includes(repo.full_name))
          .map(
            repo =>
              new Promise((res, _) => {
                octokit.repos
                  .listCommits({
                    owner: 'riskive',
                    repo: repo.name,
                    per_page: 1,
                    sha: repo.default_branch,
                    since: new Date(
                      new Date().setDate(new Date().getDate() - DaysThreshold),
                    ).toISOString(),
                  })
                  .then(({ data }) => res([repo, data] as CommitsPerRepo))
                  .catch(err => {
                    this.logger.error(
                      `Error getting commits for repo ${repo.full_name}: ${err}`,
                    );
                    res([repo, []] as CommitsPerRepo);
                  });
              }),
          ) as Promise<CommitsPerRepo>[],
      );

      // has 1 commit in the last 180 days.
      repos = repos.concat(
        commitsPerRepo.filter(c => c[1].length > 0).map(c => c[0].full_name),
      );

      if (data.length < pageSize) {
        break;
      }
      page++;
    }

    return Promise.resolve(repos);
  }

  protected async listAllAzureRepos(): Promise<string[]> {
    return Promise.resolve([]);
  }

  protected async listAllRepos(): Promise<Set<string>> {
    const excludedRepos = (
      this.config.getOptionalString(
        'app.reporting.pillarAdoption.excludedRepositories',
      ) || ''
    ).split(',');
    const githubRepos = await this.listAllGithubRepos(excludedRepos);
    const azureRepos = await this.listAllAzureRepos();

    return new Set([...githubRepos, ...azureRepos]);
  }

  protected async getComponentsPerUser(): Promise<Map<string, string[]>> {
    const { token } = await this.tokenManager.getToken();
    const allUsers = await this.catalogClient.getEntities(
      { filter: [{ kind: 'User' }] },
      { token },
    );

    // get owned entities request for each user.
    const componentsPerUserGets = allUsers.items
      .map(user => user as UserEntity)
      .map(user => [
        user as UserEntity,
        user.relations
          ?.filter(
            ({ type, targetRef }) =>
              type === 'memberOf' && targetRef.startsWith('group'),
          )
          .map(({ targetRef }) => targetRef)
          .flat() as string[],
      ])
      .map(
        ([user, teamRefs]) =>
          [
            user,
            this.catalogClient.getEntities(
              {
                filter: [
                  { kind: 'System' },
                  { kind: 'Component' },
                  { kind: 'API' },
                  ...(teamRefs as string[]).map((ref: string) => {
                    return { 'relations.ownedBy': ref };
                  }),
                ],
              },
              { token },
            ),
          ] as [UserEntity, Promise<GetEntitiesResponse>],
      );

    // get owner entities for each user
    return new Map<string, string[]>(
      (await Promise.all(componentsPerUserGets.map(([_, get]) => get)))
        .map(
          (entities, i) =>
            [
              componentsPerUserGets[i][0],
              (entities as GetEntitiesResponse).items,
            ] as [UserEntity, Entity[]],
        )
        .map(
          ([user, entities]) =>
            [
              user.metadata?.name,
              entities.map(entity => stringifyEntityRef(entity)).flat(),
            ] as [string, string[]],
        ),
    );
  }

  protected async getUsernamesPerPillar(): Promise<Map<string, string[]>> {
    const { token } = await this.tokenManager.getToken();
    const pillarTeams = await this.zfCatalogService.getPillarGlobalTeams();
    const teamToPillar = new Map<string, string>();
    for (let team of pillarTeams) {
      const pillar = team.metadata?.annotations?.[
        'zerofox.com/pillar'
      ] as string;
      const teams = await this.zfCatalogService.getTeamsForPillar(pillar);
      teams.forEach(t => teamToPillar.set(stringifyEntityRef(t), pillar));
    }

    const allTeams = await this.catalogClient.getEntities(
      {
        filter: [{ kind: 'Group', type: 'team' }],
      },
      { token },
    );

    return new Map<string, string[]>(
      allTeams.items
        .filter(team => teamToPillar.has(stringifyEntityRef(team)))
        .map(team => team as GroupEntity)
        .map(team => [
          teamToPillar.get(stringifyEntityRef(team)),
          team.spec?.members,
        ])
        .flat() as [string, string[]][],
    );
  }

  protected async getCapableOfRepoEntities(): Promise<GetEntitiesResponse> {
    const { token } = await this.tokenManager.getToken();
    return await this.catalogClient.getEntities(
      { filter: [{ kind: 'System' }, { kind: 'Component' }, { kind: 'API' }] },
      { token },
    );
  }

  protected async getLocations(): Promise<GetEntitiesResponse> {
    const { token } = await this.tokenManager.getToken();
    return await this.catalogClient.getEntities(
      { filter: [{ kind: 'Location' }] },
      { token },
    );
  }

  protected async analyzeRepos(
    repos: string[],
  ): Promise<RepoAdoptionAnalysis[]> {
    const locations = await this.getLocations();
    const repoToLocations = new Map<string, Entity[]>(
      repos.map((repo: string) => [
        repo,
        locations.items.filter(
          (location: Entity) =>
            String(location.spec?.target).indexOf(`${repo}/`) > -1,
        ),
      ]),
    );

    const capableOfRepoEntities = await this.getCapableOfRepoEntities();
    this.logger.info(
      `Entities capable of representing a repo: ${capableOfRepoEntities.items.map(
        entity => stringifyEntityRef(entity),
      )}`,
    );

    const usernamesPerPillar = await this.getUsernamesPerPillar();
    this.logger.info(
      `Usernames per pillar: ${Array.from(usernamesPerPillar.entries())
        .map(
          entry => 'Pillar: ' + entry[0] + ' Usernames: ' + entry[1].join(', '),
        )
        .join('\n')}`,
    );

    const componentsPerUser = await this.getComponentsPerUser();
    this.logger.info(
      `Components per user: ${Array.from(componentsPerUser.entries())
        .map(
          entry => 'User: ' + entry[0] + ' Components: ' + entry[1].join(', '),
        )
        .join('\n')}`,
    );

    const locationToEntities = new Map<Entity, Entity[]>(
      locations.items.map((location: Entity) => [
        location,
        capableOfRepoEntities.items.filter((entity: Entity) => {
          return (
            entity.metadata?.annotations?.[
              'backstage.io/managed-by-origin-location'
            ] == `${location.spec?.type}:${location.spec?.target}`
          );
        }),
      ]),
    );

    return Promise.resolve(
      Array.from(repoToLocations.entries()).map(([repo, locations]) => {
        const entitiesForRepo = locations
          .filter(location => locationToEntities.has(location))
          .map(location => locationToEntities.get(location))
          .flat() as Entity[];

        const hasPillar =
          entitiesForRepo.filter(
            entity => entity.metadata?.annotations?.['zerofox.com/pillar'],
          ).length > 0;

        const ownerInPillar =
          entitiesForRepo
            // all the entities that have a pillar
            .map(
              entity =>
                [
                  entity,
                  entity.metadata?.annotations?.['zerofox.com/pillar'],
                ] as [Entity, string],
            )
            // filter out the ones that don't have users in that pillar
            .filter(([_, pillar]) => pillar && usernamesPerPillar.has(pillar))
            // filter out the ones that don't have components owned by users in that pillar
            .filter(([entity, pillar]) =>
              // get the users in the pillar
              usernamesPerPillar
                .get(pillar)
                // filter out the ones that don't have components
                ?.filter(username => componentsPerUser.has(username))
                // get components for that user
                .map(username => componentsPerUser.get(username))
                // flatten the array of arrays
                .flat()
                // validate that the entity is in the list of components for that user
                .filter(entityRef => entityRef == stringifyEntityRef(entity)),
            ).length > 0;

        return {
          repo,
          hasPillar,
          ownerInPillar,
          entities: entitiesForRepo,
          owner: undefined,
        };
      }),
    );
  }

  async getTransitionRatioReport(): Promise<PillarAdoptionReport> {
    const repos = Array.from(await this.listAllRepos());
    const repoAnalysis = await this.analyzeRepos(repos);
    const adoptingRepos = repoAnalysis.filter(({ hasPillar }) => hasPillar);
    const nonAdoptingRepos = repoAnalysis.filter(
      ({ repo: repo1 }) =>
        !adoptingRepos.filter(({ repo }) => repo === repo1).length,
    );

    return {
      totalRepos: repos.length,
      totalPillarRepos: adoptingRepos.length,
      totalPillarReposPercentage: Math.round(
        (adoptingRepos.length / repos.length) * 100,
      ),
      nonAdoptingRepos: nonAdoptingRepos.map(({ repo }) => repo),
    };
  }
}
