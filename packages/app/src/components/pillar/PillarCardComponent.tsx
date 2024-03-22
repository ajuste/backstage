import React from 'react';
import { Card, CardContent, makeStyles, Link } from '@material-ui/core';
import { Entity } from '@backstage/catalog-model';
import { entityRouteParams, entityRouteRef } from '@backstage/plugin-catalog-react';
import { useRouteRef } from '@backstage/core-plugin-api';

const useStyles = makeStyles(theme => ({
    card: {
        display: 'flex',
        width: '80px',
        height: '100px',
        justifyContent: 'center',
        margin: '0 10px 10px 0',
        boxShadow: theme.shadows[1],
        backgroundColor: theme.palette.background.default,
    },
    content: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
    },
    title: {
        fontSize: '9pt',
        textAlign: 'center',
        fontWeight: 500,
        padding: 0,
        margin: 0,
    },
    iconContainer: {
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));


interface Props {
    pillar: Entity
    image: JSX.Element;
}

export const PillarCardComponent = ({ pillar, image }: Props) => {
    const classes = useStyles();
    const title = pillar.metadata?.annotations?.['zerofox.com/pillar'];
    const catalogEntityRoute = useRouteRef(entityRouteRef);
    const catalogLink = catalogEntityRoute(entityRouteParams(pillar));

    return (
        <Link href={catalogLink} key={`tool-link-${title}`}>
            <Card className={classes.card} key={`pillar-${title}`}>
                <CardContent className={classes.content} key={`tool-content-${title}`}>
                    <div className={classes.iconContainer} key={`tool-icon-${title}`}>
                        {image}
                    </div>
                    <div className={classes.title} key={`tool-title-${title}`}>{title}</div>
                </CardContent>
            </Card >
        </Link>
    );
};