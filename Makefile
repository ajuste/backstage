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
	yes | brew install jq nvm pixman cairo pango hashicorp/tap/vault && \
	source ~/.nvm/nvm.sh && \
	nvm install 18 && \
	nvm use 18 && \
	npm install --global yarn

run-local:
	export VAULT_VARS=$$(vt vault login --echo | grep TOKEN) && \
	export "$$VAULT_VARS"  && \
	export AWS_CREDS=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read aws/creds/aws-s3-developer -format=json) && \
	export AWS_ACCESS_KEY_ID=$$(echo $$AWS_CREDS | jq '.data.access_key' | sed 's/"//g') && \
	export AWS_SECRET_ACCESS_KEY=$$(echo $$AWS_CREDS | jq '.data.secret_key' | sed 's/"//g') && \
	export GITHUB_SECRETS=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read secret/backstage/github  -format=json) && \
	export AWS_REGION=us-west-2 && \
	export AUTH_GITHUB_CLIENT_SECRET="$$(echo $$GITHUB_SECRETS | jq '.data.local_client_secret' | sed 's/"//g')" && \
	export AUTH_GITHUB_CLIENT_ID=$$(echo $$GITHUB_SECRETS | jq '.data.local_client_id' | sed 's/"//g') && \
	export GITHUB_CLIENT_ID=$$(echo $$GITHUB_SECRETS | jq '.data.local_client_id' | sed 's/"//g') && \
	export GITHUB_APP_ID=$$(echo $$GITHUB_SECRETS | jq '.data.local_app_id' | sed 's/"//g') && \
	export GITHUB_APP_PRIVATE_KEY=$$(echo $$GITHUB_SECRETS | jq '.data.local_private_key' | sed 's/"//g') && \
	export GITHUB_APP_SECRET="$$(echo $$GITHUB_SECRETS | jq '.data.local_client_secret' | sed 's/"//g')" && \
	export BACKEND_BUCKET=qa-backstage && \
	export NOMAD_ALLOC_INDEX=0 && \
	export GRAFANA_TOKEN=$$(VAULT_ADDR=https://vault-qa.zerofox.com vault read secret/backstage/grafana -format=json | jq '.data.token' | sed 's/"//g') && \
	export AWS_CREDS="" && \
	export GITHUB_SECRETS="" && \
	yarn dev
