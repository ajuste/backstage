import React from 'react';
import { InfoCard, Progress } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import { PillarCardComponent } from './PillarCardComponent';
import { zfCatalogApiRef, ZFCatalogAPI } from 'backstage-plugin-zf-tech-insights-common'
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi, } from '@backstage/core-plugin-api';
import AttackSurfaceIcon from '@material-ui/icons/Public';
import ProtectionIcon from '@material-ui/icons/Security';
import SustainingIcon from '@material-ui/icons/Build';
import DisruptionIcon from '@material-ui/icons/FlashOn';
import ResponseIcon from '@material-ui/icons/RecentActors';
import IntelligenceIcon from '@material-ui/icons/GroupWork';
import DataScienceIcon from '@material-ui/icons/Functions';
import UnknownIcon from '@material-ui/icons/BrokenImage';
import { Entity } from '@backstage/catalog-model';

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

const pillarToIcon = (pillar: Entity): JSX.Element => {
    switch (pillar.metadata?.annotations?.['zerofox.com/pillar']) {
        case 'Disruption':
            return <DisruptionIcon htmlColor='#e0ca3c' style={{ 'fontSize': '60px' }}></DisruptionIcon>
        case 'Sustaining':
            return <SustainingIcon htmlColor='#A2AEBB' style={{ 'fontSize': '60px' }}></SustainingIcon>
        case 'Attack Surface':
            return <AttackSurfaceIcon htmlColor='#2d3047' style={{ 'fontSize': '60px' }}></AttackSurfaceIcon>
        case 'Response':
            return <ResponseIcon htmlColor='#23B5D3' style={{ 'fontSize': '60px' }}></ResponseIcon>
        case 'Protection':
            return <ProtectionIcon htmlColor='#49a078' style={{ 'fontSize': '60px' }}></ProtectionIcon>
        case 'Intelligence':
            return <IntelligenceIcon htmlColor='#F42272' style={{ 'fontSize': '60px' }}></IntelligenceIcon>
        case 'Data Science':
            return <DataScienceIcon htmlColor='#DAC4F7' style={{ 'fontSize': '60px' }}></DataScienceIcon>
        default:
            return <UnknownIcon style={{ 'fontSize': '60px' }}></UnknownIcon>
    }
}

export const PillardInfoCardComponent = () => {
    const classes = useStyles();

    const catalogClient = useApi(zfCatalogApiRef) as ZFCatalogAPI

    const {
        value: pillarEntities,
        loading,
        error,
    } = useAsync(async () => catalogClient.getPillars());

    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    }

    const pillarCards = pillarEntities?.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)).map(p => <PillarCardComponent pillar={p} image={pillarToIcon(p)} />);

    return (<InfoCard title="Pillars" className={classes.toolkit} cardClassName={classes.toolkit} key="tools">
        <div className={classes.toolkitContainer}>
            {pillarCards}
        </div>
    </InfoCard >)

}