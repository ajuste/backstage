import React from 'react';
import {
    HomePageStarredEntities,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';

import { Content, Page, InfoCard } from '@backstage/core-components';
import { Grid, makeStyles } from '@material-ui/core';
import { getAllTools } from '../toolkit';
import { PillardInfoCardComponent } from '../pillar/PillarsInfoCardComponent';

const useStyles = makeStyles(theme => ({
    searchBar: {
        display: 'flex',
        maxWidth: '40vw',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
        padding: '1rem 1rem',
        borderRadius: '4rem',
        margin: 'auto',
        height: '4rem',
    },
    toolkit: {
        overflowY: 'auto',
    },
    toolkitContainer: {
        display: 'flex',
        overflowY: 'auto',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    contentContainer: {
        paddingTop: '3rem',
    },
}));

export const HomePage = () => {
    const classes = useStyles();

    return (
        <Page themeId="home">
            <Content>
                <HomePageSearchBar className={classes.searchBar} />

                <Grid item md={12} className={classes.contentContainer}>
                    <Grid container spacing={3} alignItems="stretch">
                        <Grid item md={4}>
                            <InfoCard title="Toolbox" className={classes.toolkit} cardClassName={classes.toolkit} key="tools">
                                <div className={classes.toolkitContainer}>
                                    {getAllTools().map(t => t())}
                                </div>
                            </InfoCard>
                        </Grid>
                        <Grid item md={4}>
                            <PillardInfoCardComponent />
                        </Grid>
                        <Grid item md={4}>
                            <HomePageStarredEntities />
                        </Grid>
                    </Grid>
                </Grid>

            </Content>
        </Page>
    );
};