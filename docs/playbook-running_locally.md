# Local development

* Create a Personal access token following [these instructions](https://backstage.io/docs/getting-started/configuration#setting-up-a-github-integration). And add your token to your `.bash_profile`
```sh
export GITHUB_TOKEN=[your token here]
```
* Make sure to add a new entry of your user under ./local/users.yaml
  that matches your github username.

## in-memory database

Backstage will use a in-memory database.
This suits most of the use-cases when developing, its pretty straightforward and fast. If your change requires database alterations you can perform a final verification using docker-compose (explained below)

  * A memory DB is used.
  * In this case its suggested to run `yarn dev` directly on the root of the repo.
    This way you get hot reloads for changes on the react application.

## Postgres database

Backstage runs in non local environment using pgsql database.
In case you need to test with a real instance you can follow these steps:

### Run trusted mode (Backstage's db user has access to everything)
* Run `docker-compose up local`
* pginstance will be available at `localhost:5432`
* Backstage will be accessible under `http://localhost:7007`
  
### Run with same permission from prod:
* Run `docker-compose up local`
  * **Important:** Make sure `POSTGRES_HOST_AUTH_METHOD: trust`
  is set on docker-compose file for db instance.
* Connect to pginstance using username & passowrd=`backstage` under `localhost:5432` and create a role using this script:
  ```
  CREATE ROLE "backstage-admin" WITH
	LOGIN
	NOSUPERUSER
	CREATEDB
	NOCREATEROLE
	INHERIT
	NOREPLICATION
	CONNECTION LIMIT -1
	PASSWORD 'backstage';
  ```
* In `docker-compose`:
  * Make sure the following values are present under `local.environment`:
  ```
      APP_CONFIG_backend_database_client: pg
      APP_CONFIG_backend_database_connection_host: db
      APP_CONFIG_backend_database_connection_port: 5432
      APP_CONFIG_backend_database_connection_user: backstage-admin
      APP_CONFIG_backend_database_connection_password: backstage
  ```
  * Remove or comment `POSTGRES_HOST_AUTH_METHOD: trust` from `db.environment`
* Restart docker-compose to have Backstage use new role which is equivalent to production.