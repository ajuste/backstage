import axios from 'axios';

import {
  ConfigApi,
} from '@backstage/core-plugin-api';
import { RDSAPI, RDSDatabase, RDSInstance, RDSSchema, RDSTable } from 'backstage-plugin-zf-tech-insights-common';
import { CatalogApi } from '@backstage/catalog-client';

type Service = {
  deleted: boolean;
  description: string;
  fullyQualifiedName: string;
  href: string;
  id: string;
  name: string;
  serviceType: string;
  updatedAt: number;
  updatedBy: string;
  version: number;
  displayName?: string;
};

type ListInstancesResponse = {
  data: Service[];
};

type Database = {
  deleted: boolean;
  description: string;
  fullyQualifiedName: string;
  href: string;
  id: string;
  name: string;
  service: Service;
  displayName?: string;
};

type ListDatabaseResponse = {
  data: Database[];
};

type DatabaseSchema = {
  deleted: boolean;
  fullyQualifiedName: string;
  href: string;
  id: string;
  name: string;
  type: string;
  displayName?: string;
};

type Table = {
  database: Database;
  databaseSchema: DatabaseSchema;
  deleted: boolean;
  fullyQualifiedName: string;
  href: string;
  id: string;
  name: string;
  service: Service;
  serviceType: string;
  sourceHash: string;
  tableType: string;
  updatedAt: number;
  updatedBy: string;
  version: number;
  displayName?: string;
};

type ListTablesResponse = {
  data: Table[];
};

type ListSchemaResponse = {
  data: DatabaseSchema[];
};

export class RDSService implements RDSAPI {

  private configApi: ConfigApi;

  constructor(
    configApi: ConfigApi,
    _: CatalogApi,
  ) {
    this.configApi = configApi;
  }

  async getCatalogConfig(): Promise<string[]> {
    return [
      this.configApi.getString('rds.catalog.token'),
      this.configApi.getString('rds.catalog.baseUrl'),
      this.configApi.getString('rds.catalog.apiBaseUrl'),
    ];
  }

  async getInstances(): Promise<RDSInstance[]> {
    const [catalogToken, catalogBaseURL, catalogAPIBaseURL] = await this.getCatalogConfig();

    // Make the HTTP request to the catalog
    const {data} = (await axios.get(`${catalogAPIBaseURL}/services/databaseServices?limit=1000000`, {
      headers: {
        'Authorization': `Bearer ${catalogToken}`,
        'Content-Type': 'application/json'
      }
    })).data as ListInstancesResponse;

    return data.filter(s => ["postgres", "mysql"].indexOf(s.serviceType.toLowerCase()) >= 0).map((service) => {
      return {
        name: service.name,
        displayName: service.displayName,
        catalogLink: `${catalogBaseURL}/service/databaseServices/${service.name}`
      };
    });
  }

  async getDatabases(instance: RDSInstance): Promise<RDSDatabase[]> {
    const [catalogToken, catalogBaseURL, catalogAPIBaseURL] = await this.getCatalogConfig();
    const fullyQualifiedName = `${encodeURIComponent(instance.name)}`;

    // Make the HTTP request to the catalog
    const { data } = (await axios.get(`${catalogAPIBaseURL}/databases?limit=1000000&service=${fullyQualifiedName}`, {
      headers: {
        'Authorization': `Bearer ${catalogToken}`,
        'Content-Type': 'application/json'
      }
    })).data as ListDatabaseResponse;

    return data.map((database) => {
      return {
        instance: instance,
        displayName: instance.displayName,
        name: database.name,
        catalogLink: `${catalogBaseURL}/database/${fullyQualifiedName}.${encodeURIComponent(database.name)}`
      };
    });
  }

  async getSchemas(database: RDSDatabase): Promise<RDSSchema[]> {
    const [catalogToken, catalogBaseURL, catalogAPIBaseURL] = await this.getCatalogConfig();
    const fullyQualifiedName = `${encodeURIComponent(database.instance.name)}.${encodeURIComponent(database.name)}`;

    // Make the HTTP request to the catalog
    const { data } = (await axios.get(`${catalogAPIBaseURL}/databaseSchemas?limit=1000000&database=${fullyQualifiedName}`, {
      headers: {
        'Authorization': `Bearer ${catalogToken}`,
        'Content-Type': 'application/json'
      }
    })).data as ListSchemaResponse;

    return data.map((schema) => {
      return {
        name: schema.name,
        displayName: schema.displayName,
        database: database,
        catalogLink: `${catalogBaseURL}/databaseSchema/${fullyQualifiedName}.${encodeURIComponent(schema.name)}`
      };
    });
  }

  async getTables(schema: RDSSchema): Promise<RDSTable[]> {
    const [catalogToken, catalogBaseURL, catalogAPIBaseURL] = await this.getCatalogConfig();
    const fullyQualifiedName = `${encodeURIComponent(schema.database.instance.name)}.${encodeURIComponent(schema.database.name)}.${encodeURIComponent(schema.name)}`;

    // Make the HTTP request to the catalog
    const { data } = (await axios.get(`${catalogAPIBaseURL}/tables?limit=1000000&databaseSchema=${fullyQualifiedName}`, {
      headers: {
        'Authorization': `Bearer ${catalogToken}`,
        'Content-Type': 'application/json'
      }
    })).data as ListTablesResponse;

    return data.map((table) => {
      return {
        name: table.name,
        displayName: table.displayName,
        schema: schema,
        catalogLink: `${catalogBaseURL}/table/${fullyQualifiedName}.${encodeURIComponent(table.name)}`
      };
    });
  }
}