# Local development

* Install `node v18.12.1` and `yarn v1.22.19`

  ```bash
  # if using nvm
  nvm install 18
  nvm use 18
  npm install --global yarn
  ```

* Run `yarn install`

  **NOTE - If you're using a Mac with an ARM chip, you will encounter build errors installing the canvas library. The error will look like this:**
  
  ```log
  Command: node-pre-gyp install --fallback-to-build --update-binary
  Arguments:
  Directory: /Users/craborg/zerofox/documentation/backstage/node_modules/canvas
  Output:
  node-pre-gyp info it worked if it ends with ok
  node-pre-gyp info using node-pre-gyp@1.0.10
  node-pre-gyp info using node@18.19.0 | darwin | arm64
  node-pre-gyp http GET https://github.com/Automattic/node-canvas/releases/download/v2.11.2/canvas-v2.11.2-node-v108-darwin-unknown-arm64.tar.gz
  node-pre-gyp ERR! install response status 404 Not Found on https://github.com/Automattic/node-canvas/releases/download/v2.11.2/canvas-v2.11.2-node-v108-darwin-unknown-arm64.tar.gz
  node-pre-gyp WARN Pre-built binaries not installable for canvas@2.11.2 and node@18.19.0 (node-v108 ABI, unknown) (falling back to source compile with node-gyp)
  node-pre-gyp WARN Hit error response status 404 Not Found on https://github.com/Automattic/node-canvas/releases/download/v2.11.2/canvas-v2.11.2-node-v108-darwin-unknown-arm64.tar.gz
  ```

  A workaround would be to remove canvas from [packages/app/packages.json][../packages/app/packages.json]] and [yarn.lock](../yarn.lock), 
  then running `yarn install` again. 

  > @craborg I have not found a way to force yarn to install canvas using a different architecture. This is the only thing I've found that works so far :(

* Set any environment variables that `aop-config.yaml` will need to function. 
  You'll want at least a GitHub token.
  You can create a this token by following [these instructions](https://backstage.io/docs/getting-started/configuration#setting-up-a-github-integration). And add your token to your `.bash_profile`

  ```sh
  export GITHUB_TOKEN=[your token here]
  ```

* Make sure to add a new entry of your user under ./local/users.**yaml**
  that matches your github username.

* You can run `yarn dev` after your environment variables are set.

## in-memory database

Backstage will use a in-memory database.
This suits most of the use-cases when developing, its pretty straightforward and fast. If your change requires database alterations you can perform a final verification using docker-compose (explained below)

  * A memory DB is used.
  * In this case its suggested to run `yarn dev` directly on the root of the repo.
    This way you get hot reloads for changes on the react application.

## Postgres database

Backstage runs in non local environment using pgsql database.
In case you need to test with a real instance you can follow these steps:


### docker-compose

In order to get docker-compose running follow these steps:
```sh
# First we need to install awscli for authenticating against AWS ECR (Elastic Container Registry)
# This will be needed to pull the gold-docker base image
pip install awscli

# Then we must provide credentials for awscli
# These can be generated via https://vault-qa.zerofox.com/ui/vault/secrets/aws/credentials/aws-ecr-ro
# MUST access vault through VPN
# Hint: Authenticate to Vault using a Github token!
# Github > Profile > Developer Settings > Personal Access Tokens > Permissions ['read:user', 'read:email', 'read:follow']
aws configure

# Then we can authenticate against ECR and supply credentials to docker
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 012321959326.dkr.ecr.us-west-2.amazonaws.com

# Finally we can run docker-compose (make sure to use the right ssh key)
SSH_PRIVATE_KEY="$(< ~/.ssh/id_ed25519)" docker-compose up local
```

### Run trusted mode (Backstage's db user has access to everything)
* Run docker compose following instructions from docker-compose section.
* pginstance will be available at `localhost:5432`
* Backstage will be accessible under `http://localhost:7007`
  
### Run with same permission from prod:
* Run docker compose following instructions from docker-compose section.
  * **Important:** Make sure `POSTGRES_HOST_AUTH_METHOD: trust`.
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