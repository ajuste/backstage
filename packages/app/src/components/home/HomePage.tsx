import React from 'react';
import { Content, Page, InfoCard } from '@backstage/core-components';
import { Grid, makeStyles } from '@material-ui/core';
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

    return (
        <Page themeId="home">
            <Content>
                <Grid item xs={12} md={6}>
                    <InfoCard title="Toolbox" className={classes.toolkit} cardClassName={classes.toolkit}>
                        <div className={classes.toolkitContainer}>
                            {getAllTools().map(t => t())}
                        </div>
                    </InfoCard>
                </Grid>
            </Content>
        </Page>
    );
};