import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  HeaderLabel,
} from '@backstage/core-components';
import { PillarAdoptionRatioFetchComponent } from '../PillarAdoptionRatioFetchComponent';

export const PillarAdoptionRatioComponent = () => (
  <Page themeId="tool">
    <Header title="Pillar adoption ratio">
      <HeaderLabel label="Owner" value="Alvaro Juste" />
    </Header>
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Description">
            <Typography variant="body1">
              % of services with changes in the past 180 days that are assigned to a pillar and have at least one SO within the pillar.
            </Typography>
          </InfoCard>
        </Grid>
        <Grid item>
          <PillarAdoptionRatioFetchComponent />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
