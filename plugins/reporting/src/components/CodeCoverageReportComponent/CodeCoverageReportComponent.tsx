import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  HeaderLabel,
} from '@backstage/core-components';
import { CodeCoverageReportFetchComponent } from '../CodeCoverageReportFetchComponent';

export const CodeCoverageReportComponent = () => (
  <Page themeId="tool">
    <Header title="Code coverage report" subtitle="Optional subtitle">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Description">
            <Typography variant="body1">
              Listing of coverage by component in the system. It shows branch and line coverage.
            </Typography>
          </InfoCard>
        </Grid>
        <Grid item>
          <CodeCoverageReportFetchComponent />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
