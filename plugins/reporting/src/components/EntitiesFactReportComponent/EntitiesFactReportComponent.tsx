import React, { useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid, Typography } from '@material-ui/core';
import { Content, Progress, Header, Page, InfoCard, HeaderLabel, Select, SelectItem } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { techInsightsApiRef, TechInsightsClient } from '@backstage-community/plugin-tech-insights';
import { FactSchema } from '@backstage-community/plugin-tech-insights-common';
import { EntitiesFactReportFetchComponent } from '../EntitiesFactReportFetchComponent';

const ignoredFactRetrievers = ["techdocsFactRetriever", "entityOwnershipFactRetriever", "entityMetadataFactRetriever"]

const toNonCamelCaseUpperCaseFirst = function (str: string): string {
  // Insert a space before all caps
  let result = str.replace(/([A-Z])/g, ' $1');
  // Uppercase the first character and trim any leading space
  return result.charAt(0).toUpperCase() + result.slice(1).trim();
}

const SchemaComponent = (): any => {
  const techInsightsClient = useApi(techInsightsApiRef) as TechInsightsClient
  const {
    value: availableSchemas,
    loading,
    error,
  } = useAsync(async () => {
    return await techInsightsClient.getFactSchemas()
  });

  const [value, setValue] = useState("");
  const [factRetrieverIdschema, setFactRetrieverIdschema] = useState("");
  const [factId, setFactId] = useState("");

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  let items = [];
  for (let schema of availableSchemas || []) {
    for (const key in schema) {
      if ((ignoredFactRetrievers).indexOf(String((schema as FactSchema).id)) !== -1) continue
      if (!schema.hasOwnProperty(key)) continue
      let value = (schema as FactSchema)[key as string] ?? {}
      if (typeof value === "object" && "type" in value) {
        items.push({ "value": `${(schema as FactSchema).id}.${key}`, "label": toNonCamelCaseUpperCaseFirst(key) } as SelectItem)
      }
    }
  }
  return [(
    <Select selected={value} items={items} onChange={val => {
      const [schema, fact] = (val as string).split(".")
      setValue(val as string)
      setFactRetrieverIdschema(schema)
      setFactId(fact)
    }} label="Fact" />),
  value ?
    <EntitiesFactReportFetchComponent factRetrieverIdschema={factRetrieverIdschema} factId={factId} /> :
    null
  ];
}

export const EntitiesFactReportComponent = () => {
  return (
    <Page themeId="tool">
      <Header title="Entities fact report" subtitle="Get facts for all entities">
        <HeaderLabel label="Owner" value="Alvaro Juste" />
      </Header>
      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard title="Description">
              <Typography variant="body1">
                List fact value for all entities.
              </Typography>
            </InfoCard>
          </Grid>
          <Grid item>
            <SchemaComponent></SchemaComponent>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}