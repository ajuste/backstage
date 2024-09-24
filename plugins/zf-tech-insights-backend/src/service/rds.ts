import knex, { Knex } from 'knex';

import {
  ConfigApi,
} from '@backstage/core-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { RDSAPI, RDSDatabase, RDSTable } from 'backstage-plugin-zf-tech-insights-common';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';

type DBFunctionMapping = {
  [key: string]: {
    "list_databases": (client: Knex) => Promise<RDSDatabase[]>;
    "get_tables": (client: Knex, database: string) => Promise<RDSTable[]>;
  };
};

const dbFunctions: DBFunctionMapping = {
  "mysql2": {
    "list_databases": async (client: Knex): Promise<RDSDatabase[]> => {
      const res = await client.raw('SHOW DATABASES');
      return res[0].map((p: any) => { return { name: p.Database } });
    },
    "get_tables": async (client: Knex, _: string): Promise<RDSTable[]> => {
      const res = await client.raw('SHOW TABLES');
      const fieldName = res[1][0].name as string;
      return res[0].map((p: any) => { return { name: p[fieldName] } });
    },
  },
  "pg": {
    "list_databases": async (client: Knex): Promise<RDSDatabase[]> => {
      const {rows} = await client.raw('SELECT datname FROM pg_database WHERE datistemplate = false and datname <> \'rdsadmin\' order by datname ASC');
      return rows.map((row: any) => { return { name: row.datname } });
    },
    "get_tables": async (client: Knex, database: string): Promise<RDSTable[]> => {
      const {rows} = await client.raw(`SELECT table_name FROM information_schema.tables WHERE table_catalog = '${database}' and table_type = 'BASE TABLE' and table_schema = 'public' order by table_name ASC`);
      return rows.map((row: any) => { return { name: row.table_name } });
    },
  }
}

export class RDSService implements RDSAPI {

  private configApi: ConfigApi;
  private catalogApi: CatalogApi;

  constructor(
    configApi: ConfigApi,
    catalogApi: CatalogApi,
  ) {
    this.configApi = configApi;
    this.catalogApi = catalogApi;
  }

  private async getRDSClient(instance: CompoundEntityRef, database: string | undefined): Promise<Knex> {
    debugger
    const config = this.configApi.getOptionalConfig(`rds.db.${instance.name.replace(/\d/g, 'x')}`);
    if (!config) {
      throw new Error(`No configuration found for RDS instance ${stringifyEntityRef(instance)}`);
    }

    const rdsInstance = await this.catalogApi.getEntityByRef(stringifyEntityRef(instance));
    if (!rdsInstance) {
      throw new Error(`No RDS instance found ${stringifyEntityRef(instance)}`);
    }

    let clientType = "";
    const engine = rdsInstance.spec?.['engine'];
    switch (engine) {
      case 'postgres':
        clientType = 'pg';
        database = database ?? 'postgres';
        break;
      case 'mysql':
        clientType = 'mysql2';
        break;
      default:
        throw new Error(`Unsupported RDS engine ${engine}`);
    }

    const client = knex({
      client: clientType,
      connection: {
        host: config.getString('host'),
        user: config.getString('user'),
        password: config.getString('password'),
        database: database,
      },
    });
    return client;
  }

  async getDatabases(instance: CompoundEntityRef): Promise<RDSDatabase[]> {
    const client = await this.getRDSClient(instance, undefined);
    const engine = client.client.config.client;
    return dbFunctions[engine].list_databases(client);
  }

  async getTables(instance: CompoundEntityRef, database: string): Promise<RDSTable[]> {
    const client = await this.getRDSClient(instance, database);
    const engine = client.client.config.client;
    return dbFunctions[engine].get_tables(client, database);
  }
}