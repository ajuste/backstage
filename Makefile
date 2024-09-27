backend-build:
	yarn install && yarn tsc && yarn build

build: backend-build

image: build
	yarn build-image

ecr-login:
	aws ecr get-login-password --region us-west-2

image-deps: ecr-login
	docker build . --tag 012321959326.dkr.ecr.us-west-2.amazonaws.com/zf/backstage-deps:latest -f Dockerfile-deps
	docker push 012321959326.dkr.ecr.us-west-2.amazonaws.com/zf/backstage-deps:latest

reinstall-all-deps:
	find . -name 'node_modules' -type d && yarn install

tools:
	GOPRIVATE=github.com/riskive go install github.com/riskive/vt@latest && \
	GOPRIVATE=github.com/riskive go install github.com/riskive/backstage-zf-cli@latest && \
	yes | brew tap hashicorp/tap && \
	yes | brew install jq nvm pkg-config pixman cairo pango hashicorp/tap/vault && \
	source ~/.nvm/nvm.sh && \
	nvm install 18 && \
	nvm use 18 && \
	npm install --global yarn

run-local:
	VAULT_ADDR=https://vault-qa.zerofox.com vt vault login && \
	export NOMAD_TOKEN=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read nomad/creds/backstage-local -format=json | jq -r '.data.secret_id') && \
	export VAULT_VARS=$$(vt vault login --echo | grep TOKEN) && \
	export "$$VAULT_VARS"  && \
	export AWS_CREDS=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read aws/creds/aws-s3-developer -format=json) && \
	export AWS_ACCESS_KEY_ID=$$(echo $$AWS_CREDS | jq -r '.data.access_key') && \
	export AWS_SECRET_ACCESS_KEY=$$(echo $$AWS_CREDS | jq -r '.data.secret_key') && \
	export GITHUB_SECRETS=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read secret/backstage-local/github  -format=json) && \
	export AWS_REGION=us-west-2 && \
	export AUTH_GITHUB_CLIENT_SECRET="$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_secret')" && \
	export AUTH_GITHUB_CLIENT_ID=$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_id') && \
	export GITHUB_CLIENT_ID=$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_id') && \
	export GITHUB_APP_ID=$$(echo $$GITHUB_SECRETS | jq -r '.data.local_app_id') && \
	export GITHUB_APP_PRIVATE_KEY=$$(echo $$GITHUB_SECRETS | jq -r '.data.local_private_key') && \
	export GITHUB_APP_SECRET="$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_secret')" && \
	export BACKEND_BUCKET=qa-backstage && \
	export NOMAD_ALLOC_INDEX=0 && \
	export GRAFANA_TOKEN=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read secret/backstage-local/grafana -format=json | jq -r '.data.token') && \
	export AWS_CREDS="" && \
	export GITHUB_SECRETS="" && \
	export BADGES_BUCKET="zf-dashboard-media-qa" && \
	export DATA_CATALOG_TOKEN==$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read secret/backstage-local/datacatalog -format=json | jq -r '.data.token') && \ 
	yarn dev
