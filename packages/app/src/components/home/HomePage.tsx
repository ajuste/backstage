import { Content, Page, InfoCard } from '@backstage/core-components';
import {
    HomePageSearchBar,
} from '@backstage/plugin-search';
import { Grid, makeStyles } from '@material-ui/core';
import React from 'react';
import LogoFull from '../Root/LogoFull';
import { getAllTools } from '../toolkit';

const useStyles = makeStyles(theme => ({
    searchBar: {
        display: 'flex',
        maxWidth: '60vw',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
        padding: '8px 0',
        borderRadius: '50px',
        margin: 'auto',
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
}));

export const HomePage = () => {
    const classes = useStyles();
    //const { svg, path, container } = useLogoStyles();

    return (
        <Page themeId="home">
            <Content>
                <Grid container justifyContent="center" spacing={6}>
                    <Grid container item xs={12} alignItems="center" direction="row">
                        <HomePageSearchBar
                            classes={{ root: classes.searchBar }}
                            placeholder="Search"
                        />
                    </Grid>
                    <Grid container item xs={12}>
                        <Grid item xs={12} md={12}>
                            <InfoCard title="Toolbox" className={classes.toolkit} cardClassName={classes.toolkit}>
                                <div className={classes.toolkitContainer}>
                                    {getAllTools().map(t => t())}
                                </div>
                            </InfoCard>
                        </Grid>
                    </Grid>
                </Grid>
            </Content>
        </Page>
    );
};