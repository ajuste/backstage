import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  HeaderLabel,
} from '@backstage/core-components';
import { ComponentStalenessReportFetchComponent } from '../ComponentStalenessReportFetchComponent';

export const ComponentStalenessReportComponent = () => (
  <Page themeId="tool">
    <Header title="Component staleness report">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Description">
            <Typography variant="body1">
              Lists component with latest commit information to hosting repo and if it fulifills staleness criteria.
            </Typography>
          </InfoCard>
        </Grid>
        <Grid item>
          <ComponentStalenessReportFetchComponent />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
