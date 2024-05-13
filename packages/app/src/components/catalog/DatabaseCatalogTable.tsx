import React, { useEffect, useMemo, useState } from 'react';
import { TableColumn, Link, Progress } from '@backstage/core-components';
import { CatalogTable, CatalogTableRow } from '@backstage/plugin-catalog';
import Alert from '@material-ui/lab/Alert';
import { CatalogApi, entityRouteParams, entityRouteRef } from '@backstage/plugin-catalog-react';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { CompoundEntityRef, Entity, RELATION_OWNED_BY } from '@backstage/catalog-model';
import AlertIcon from '@material-ui/icons/Alarm';

type DatabaseCatalogTableProps = {
  pillarEntities: Array<Entity>;
};

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

        const ownerEntities = await Promise.all(entity.relations
          .filter(relation => relation.type === RELATION_OWNED_BY)
          .map((relation: any) => relation.target ? catalogApiClient.getEntityByRef(relation.target as CompoundEntityRef) : Promise.resolve())
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


export const DatabaseCatalogTable = (props: DatabaseCatalogTableProps): JSX.Element => {
  const catalogEntityRoute = useRouteRef(entityRouteRef);
  const { pillarEntities = [] } = props;

  const columns: TableColumn<CatalogTableRow>[] = useMemo(() => [
    {
      title: 'ID',
      field: 'metadata.name',
      render: ({ entity }) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Link to={catalogEntityRoute({ kind: 'Resource', namespace: 'default', name: entity.metadata.name })} target="_blank">
            {entity.metadata.name}
          </Link>
        </div>
      ),
    },
    {
      title: 'Instance Class',
      field: 'spec.instanceClass',
      render: ({ entity }) => entity.spec?.instanceClass,
    },
    {
      title: 'Engine',
      field: 'spec.engine',
      render: ({ entity }) => entity.spec?.engine,
    },
    {
      title: 'Version',
      field: 'spec.version',
      render: ({ entity }) => entity.spec?.version,
    },
    {
      title: 'Encryption',
      field: 'spec.encryption',
      render: ({ entity }) => (entity.spec?.encryption ? 'Yes' : 'No'),
    },
    {
      title: 'Deployment Option',
      field: 'spec.deploymentOption',
      render: ({ entity }) => entity.spec?.deploymentOption,
    },
    { 
      title: 'Pillar',
      field: 'entity.metadata.annotations.zerofox.com/pillar',
      render: ({ entity }) => {
        const pillar = entity.metadata.annotations?.["zerofox.com/pillar"]
        if (!pillar) {
          return null
        }
        let link = ""
        const pillarComponent = pillarEntities.find(pillarEntity => pillarEntity.metadata.annotations?.["zerofox.com/pillar"] === pillar)
        if (pillarComponent) {
          const catalogEntityRoute = useRouteRef(entityRouteRef);
          link = catalogEntityRoute(entityRouteParams(pillarComponent))
        }
        return <div style={{ whiteSpace: 'nowrap' }}><Link to={link} target="_blank">{pillar}</Link></div>
      }
    },
    {
      title: 'Maintenance/Health Event',
      field: 'entity.metadata.upcoming_event_days_left',
      render: ({ entity }) => {
        const daysLeft = entity.metadata?.upcoming_event_days_left;
        if (daysLeft && daysLeft !== null) {
          if (Number(daysLeft) > 30) {
            return (
              <Link to={catalogEntityRoute({ kind: 'Resource', namespace: 'default', name: entity.metadata.name })} target="_blank">
                <Alert severity="success" variant="outlined" icon={<AlertIcon />}>
                  {String(daysLeft)} days left
                </Alert>
              </Link>
            );
          }
          if (Number(daysLeft) < 31) {
            return (
              <Link to={catalogEntityRoute({ kind: 'Resource', namespace: 'default', name: entity.metadata.name })} target="_blank">
                <Alert severity="error" variant="outlined" icon={<AlertIcon />}>
                  {String(daysLeft)} days left
                </Alert>
              </Link>
            );
          }
        }
        return null;
            }
        },
    {
      title: 'Ownership',
      render: ({ entity }) => {
        const catalogApiClient = useApi(catalogApiRef) as CatalogApi;
        const { owners, loading, error } = useOwners(entity, catalogApiClient);
        
        if (loading) {
          return <Progress />;
        } else if (error) {
          return <Alert severity="error">{error.message}</Alert>;
        }
  
        return (
          <>
            {owners.map((owner, index) => (
              <React.Fragment key={index}>
                {index > 0 ? ', ' : ''}
                <Link to={catalogEntityRoute({ kind: owner.kind ?? '', namespace: owner.metadata.namespace ?? '', name: owner.metadata.name ?? '' })} target="_blank">
                  {owner.metadata.name}
                </Link>
              </React.Fragment>
            ))}
          </>
        );
      },
    },
  ], [pillarEntities, catalogEntityRoute, useApi(catalogApiRef)]);

  return <CatalogTable {...props} columns={columns} />;
};
