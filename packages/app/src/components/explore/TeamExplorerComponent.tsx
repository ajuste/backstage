
import React from 'react';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { GroupEntity } from '@backstage/catalog-model';
import { Progress } from '@backstage/core-components';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import {
    catalogApiRef,
    entityRouteParams,
    entityRouteRef,
} from '@backstage/plugin-catalog-react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import { makeStyles } from '@material-ui/core/styles';

import {
    Content,
    ContentHeader,
    Button,
    ItemCardHeader,
    ItemCardGrid,
} from '@backstage/core-components';

const useStyles = makeStyles({
    header0: {
        background: 'rgb(0,115,83);',
        backgroundImage: 'linear-gradient(90deg, rgba(0,115,83,1) 0%, rgba(13,163,100,1) 77%);',
    },
    header1: {
        background: 'rgb(126,6,171);',
        backgroundImage: 'linear-gradient(90deg, rgba(126,6,171,1) 0%, rgba(91,31,135,1) 77%)',
    },
    header2: {
        background: 'rgb(6,97,171);',
        backgroundImage: 'linear-gradient(90deg, rgba(6,97,171,1) 0%, rgba(31,116,135,1) 77%);',
    },
});

type TeamCardComponentProps = {
    entity: GroupEntity;
}

const TeamCardComponent = (props: TeamCardComponentProps) => {
    const { entity } = props
    const catalogEntityRoute = useRouteRef(entityRouteRef);
    const catalogLink = catalogEntityRoute(entityRouteParams(entity));
    const classes = useStyles()
    let headerClass;
    const index = Math.random() * Object.keys(classes).length
    if (index < 1) {
        headerClass = classes.header0;
    } else if (index < 2) {
        headerClass = classes.header1;
    } else {
        headerClass = classes.header2;
    }

    return (
        <Card key={entity.metadata.name}>
            <CardMedia>
                <ItemCardHeader title={entity?.spec?.profile?.displayName} subtitle="scrum-team" classes={{ root: headerClass }} />
            </CardMedia>
            <CardContent>
                {entity.metadata.description}
            </CardContent>
            <CardActions>
                <Button color="primary" to={catalogLink}>
                    See team
                </Button>
            </CardActions>
        </Card>
    );
}

export const TeamsExplorerComponent = () => {

    const catalogApiClient = useApi(catalogApiRef) as CatalogApi
    const {
        value: entities,
        loading,
        error,
    } = useAsync(async () => {

        const response = await catalogApiClient.getEntities({
            filter: {
                "kind": "Group",
                "spec.type": "team",
                "metadata.tags": ["scrum-team"]
            },
        })

        return response.items as GroupEntity[];
    }, [catalogApiClient])


    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    }

    const cards = entities?.map((entity) => (
        <TeamCardComponent entity={entity}></TeamCardComponent>
    ))

    return (
        <Content>
            <ContentHeader title="Scrum teams" />
            <ItemCardGrid>
                {cards}
            </ItemCardGrid>
        </Content>
    );
};