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
        <Card key="code-coverage" data-testid='code-coverage'>
          <CardMedia>
            <ItemCardHeader title="Code coverage" subtitle="quality" />
          </CardMedia>
          <CardContent>
            Generate code coverage report.
          </CardContent>
          <CardActions>
            <Button color="primary" to="/reporting/code-coverage" data-testid='code-coverage-link'>
              See report
            </Button>
          </CardActions>
        </Card>
        <Card key="service-staleness" data-testid='service-staleness'>
          <CardMedia>
            <ItemCardHeader title="Service Staleness" subtitle="quality" />
          </CardMedia>
          <CardContent>
            Understand which services have not been updated in a while.
          </CardContent>
          <CardActions>
            <Button color="primary" to="/reporting/service-staleness" data-testid='service-staleness-link'>
              See report
            </Button>
          </CardActions>
        </Card>
        <Card key="entities-facts" data-testid='entities-facts'>
          <CardMedia>
            <ItemCardHeader title="Entities fact" subtitle="facts" />
          </CardMedia>
          <CardContent>
            Checkout what is the fact value for every entity.
          </CardContent>
          <CardActions>
            <Button color="primary" to="/reporting/entities-fact" data-testid='entities-facts'>
              See report
            </Button>
          </CardActions>
        </Card>
        <Card key="entities-checks" data-testid='entities-checks'>
          <CardMedia>
            <ItemCardHeader title="Entities checks" subtitle="checks" />
          </CardMedia>
          <CardContent>
            Checkout what is the checks for every entity.
          </CardContent>
          <CardActions>
            <Button color="primary" to="/reporting/entities-checks" data-testid='entities-checks'>
              See report
            </Button>
          </CardActions>
        </Card>
      </ItemCardGrid>
    </Content>
  </Page>
);
