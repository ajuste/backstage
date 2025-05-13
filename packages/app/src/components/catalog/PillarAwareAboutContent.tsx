/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Alert from '@material-ui/lab/Alert';
import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
  CompoundEntityRef,
} from '@backstage/catalog-model';
import {
  EntityRefLinks,
  getEntityRelations,
} from '@backstage/plugin-catalog-react';
import { Chip, Grid, makeStyles } from '@material-ui/core';
import { MarkdownContent, Progress, Link } from '@backstage/core-components';
import React from 'react';
import { useEffect, useState } from 'react';
import { AboutField } from '@backstage/plugin-catalog';
import { CatalogApi } from '@backstage/catalog-client';
import {
  techInsightsApiRef,
  TechInsightsClient,
} from '@backstage-community/plugin-tech-insights';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useRouteRef, useApi } from '@backstage/core-plugin-api';
import { JsonObject } from '@backstage/types';
import {
  entityRouteRef,
  entityRouteParams,
} from '@backstage/plugin-catalog-react';

const useStyles = makeStyles({
  description: {
    wordBreak: 'break-word',
  },
});

/**
 * Props for {@link AboutContent}.
 *
 * @public
 */
export interface AboutContentProps {
  entity: Entity;
}

function useOwners(entity: Entity, catalogApiClient: CatalogApi) {
  const [owners, setOwners] = useState([]) as [Entity[], any];
  const [loading, setLoading] = useState(true) as [boolean, any];
  const [error, setError] = useState(null) as [any, any];

  useEffect(() => {
    async function fetchOwners() {
      try {
        if (!entity.relations) {
          setOwners([]);
          setLoading(false);
          return;
        }

        const ownerEntities = await Promise.all(
          entity.relations
            .filter(relation => relation.type === RELATION_OWNED_BY)
            .map((relation: any) =>
              relation.target
                ? catalogApiClient.getEntityByRef(
                    relation.target as CompoundEntityRef,
                  )
                : Promise.resolve(),
            ),
        );

        setOwners(ownerEntities.filter(owner => owner) as any);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    fetchOwners();
  }, [entity, catalogApiClient]);

  return { owners, loading, error };
}

function useTechInsights(entity: Entity) {
  const techInsightsClient = useApi(techInsightsApiRef) as TechInsightsClient;
  const [facts, setFacts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTechInsights() {
      try {
        const response = await techInsightsClient.getFacts(
          entity as unknown as CompoundEntityRef,
          ['githubFactRetriever'],
        );
        setFacts(response.githubFactRetriever.facts);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchTechInsights();
  }, [entity, techInsightsClient]);

  return { facts, loading, error };
}

function useTechDebtComponent(entity: Entity) {
  const {
    facts,
    loading: factsLoading,
    error: factsError,
  } = useTechInsights(entity);

  let issuesURL = '';
  const techDebtQueryParams = 'q=state%3Aopen%20label%3Atechnical-debt%20';

  if (entity?.metadata?.annotations?.['github.com/project-slug']) {
    issuesURL =
      `https://github.com/${entity?.metadata?.annotations?.['github.com/project-slug']}/issues?${techDebtQueryParams}` ||
      '';
  }

  let issuesContent = null;
  if (factsLoading) {
    issuesContent = <Progress />;
  } else if (factsError) {
    issuesContent = <div>Couldn't retrieve facts</div>;
  } else {
    issuesContent = (
      <div>
        {issuesURL && facts?.openTechDebtIssuesCount !== undefined ? (
          <Link to={issuesURL} target="_blank">
            {facts?.openTechDebtIssuesCount} Unresolved Issues
          </Link>
        ) : (
          'N/A'
        )}
      </div>
    );
  }

  let ratioContent = null;
  if (factsLoading) {
    ratioContent = <Progress />;
  } else if (factsError) {
    ratioContent = <div>Couldn't retrieve facts</div>;
  } else {
    const roundedRatio = facts?.techDebtRatio
      ? Number(facts.techDebtRatio).toFixed(2)
      : undefined;
    ratioContent = <div>{roundedRatio || 'N/A'}</div>;
  }

  return (
    <>
      <AboutField
        label="Tech Debt Issues"
        value="No Data"
        gridSizes={{ xs: 12, sm: 6, lg: 4 }}
      >
        {issuesContent}
      </AboutField>
      <AboutField
        label="Tech Debt Ratio"
        value="No Data"
        gridSizes={{ xs: 12, sm: 6, lg: 4 }}
      >
        {ratioContent}
      </AboutField>
    </>
  );
}

/** @public */
export function PillarAwareAboutContent(props: AboutContentProps) {
  const { entity } = props;
  const classes = useStyles();
  const isSystem = entity.kind.toLocaleLowerCase('en-US') === 'system';
  const isResource = entity.kind.toLocaleLowerCase('en-US') === 'resource';
  const isComponent = entity.kind.toLocaleLowerCase('en-US') === 'component';
  const isAPI = entity.kind.toLocaleLowerCase('en-US') === 'api';
  const isTemplate = entity.kind.toLocaleLowerCase('en-US') === 'template';
  const isLocation = entity.kind.toLocaleLowerCase('en-US') === 'location';
  const isGroup = entity.kind.toLocaleLowerCase('en-US') === 'group';

  const partOfSystemRelations = getEntityRelations(entity, RELATION_PART_OF, {
    kind: 'system',
  });
  const partOfComponentRelations = getEntityRelations(
    entity,
    RELATION_PART_OF,
    {
      kind: 'component',
    },
  );
  const partOfDomainRelations = getEntityRelations(entity, RELATION_PART_OF, {
    kind: 'domain',
  });
  const catalogApiClient = useApi(catalogApiRef) as CatalogApi;
  const {
    owners,
    loading: ownersLoading,
    error: ownersError,
  } = useOwners(entity, catalogApiClient);
  const catalogEntityRoute = useRouteRef(entityRouteRef);

  let ownerComponent = null;
  if (ownersLoading) {
    ownerComponent = <Progress />;
  } else if (ownersError) {
    ownerComponent = <Alert severity="error">{ownersError.message}</Alert>;
  } else {
    const ownerLinks = owners.map((owner, i) => {
      const name =
        (i > 0 ? ', ' : '') +
        ((owner.spec?.profile as JsonObject)?.displayName ||
          owner.metadata.name);
      const link = catalogEntityRoute(entityRouteParams(owner));
      return (
        <Link to={link} target="_blank">
          {name}
        </Link>
      );
    });
    ownerComponent = ownerLinks;
  }

  const techDebtComponent = useTechDebtComponent(entity);

  return (
    <Grid container>
      <AboutField
        label="Pillar"
        value={
          (entity?.metadata?.annotations?.['zerofox.com/pillar'] as string) ||
          'Not set'
        }
        gridSizes={{ xs: 12, sm: 6, lg: 4 }}
      />
      <AboutField label="Description" gridSizes={{ xs: 12 }}>
        <MarkdownContent
          className={classes.description}
          content={entity?.metadata?.description || 'No description'}
        />
      </AboutField>

      <AboutField
        label="Owner"
        value="No Owner"
        gridSizes={{ xs: 12, sm: 6, lg: 4 }}
      >
        {ownerComponent}
      </AboutField>
      {(isSystem || partOfDomainRelations.length > 0) && (
        <AboutField
          label="Domain"
          value="No Domain"
          gridSizes={{ xs: 12, sm: 6, lg: 4 }}
        >
          {partOfDomainRelations.length > 0 && (
            <EntityRefLinks
              entityRefs={partOfDomainRelations}
              defaultKind="domain"
            />
          )}
        </AboutField>
      )}
      {(isAPI ||
        isComponent ||
        isResource ||
        partOfSystemRelations.length > 0) && (
        <AboutField
          label="System"
          value="No System"
          gridSizes={{ xs: 12, sm: 6, lg: 4 }}
        >
          {partOfSystemRelations.length > 0 && (
            <EntityRefLinks
              entityRefs={partOfSystemRelations}
              defaultKind="system"
            />
          )}
        </AboutField>
      )}
      {isComponent && partOfComponentRelations.length > 0 && (
        <AboutField
          label="Parent Component"
          value="No Parent Component"
          gridSizes={{ xs: 12, sm: 6, lg: 4 }}
        >
          <EntityRefLinks
            entityRefs={partOfComponentRelations}
            defaultKind="component"
          />
        </AboutField>
      )}
      {(isAPI ||
        isComponent ||
        isResource ||
        isTemplate ||
        isGroup ||
        isLocation ||
        typeof entity?.spec?.type === 'string') && (
        <AboutField
          label="Type"
          value={entity?.spec?.type as string}
          gridSizes={{ xs: 12, sm: 6, lg: 4 }}
        />
      )}
      {(isAPI ||
        isComponent ||
        typeof entity?.spec?.lifecycle === 'string') && (
        <AboutField
          label="Lifecycle"
          value={entity?.spec?.lifecycle as string}
          gridSizes={{ xs: 12, sm: 6, lg: 4 }}
        />
      )}
      <AboutField
        label="Tags"
        value="No Tags"
        gridSizes={{ xs: 12, sm: 6, lg: 4 }}
      >
        {(entity?.metadata?.tags || []).map(t => (
          <Chip key={t} size="small" label={t} />
        ))}
      </AboutField>
      {techDebtComponent}
    </Grid>
  );
}
