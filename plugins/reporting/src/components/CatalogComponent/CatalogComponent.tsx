import React from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';

import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  Button,
  ItemCardHeader,
  ItemCardGrid,
} from '@backstage/core-components';

export const CatalogComponent = () => (
  <Page themeId="tool">
    <Header title="Welcome to reporting!" subtitle="Generate reports based on system components">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <ContentHeader title="Available reports" />
      <ItemCardGrid>
        <Card key="code-coverage">
          <CardMedia>
            <ItemCardHeader title="Code coverage" subtitle="testing" />
          </CardMedia>
          <CardContent>
            Generate code coverage for components in the system.
          </CardContent>
          <CardActions>
            <Button color="primary" to="/reporting/code-coverage">
              See report
            </Button>
          </CardActions>
        </Card>
      </ItemCardGrid>
    </Content>
  </Page>
);
