SSH_DIR?=~/.ssh
SSH_KEY_PATHS := $(SSH_DIR)/id_rsa $(SSH_DIR)/id_ed25519 $(SSH_DIR)/id_ecdsa
SSH_KEY_CONTENT = $(shell awk '{printf "%s\\n", $$0}' $(SSH_PRIVATE_KEY))

BLUE=\033[0;34m
YELLOW=\033[0;33m
RED=\033[0;31m
NC=\033[0m

define find_ssh_key
$(foreach path,$(SSH_KEY_PATHS),$(if $(wildcard $(path)),cat $(path) | awk 'BEGIN {ORS="\\n"}; 1' ,))
endef

build:
	@docker compose build --build-arg SSH_PRIVATE_KEY="$(shell $(call find_ssh_key))"

ecr-login:
	aws ecr get-login-password --region us-west-2

reinstall-all-deps:
	find . -name 'node_modules' -type d | xargs rm -rf && yarn install

tools:
	GOPRIVATE=github.com/riskive go install github.com/riskive/vt@latest && \
	GOPRIVATE=github.com/riskive go install github.com/riskive/backstage-zf-cli@latest && \
	yes | brew tap hashicorp/tap && \
	yes | brew install jq nvm pkg-config pixman cairo pango hashicorp/tap/vault dpkg FiloSottile/musl-cross/musl-cross && \
	source ~/.nvm/nvm.sh && \
	nvm install 18 && \
	nvm use 18 && \
	npm install --global yarn

run-load-credentials:
	@ echo "$(YELLOW)>>> Pulling secrets: Make sure you are connected to the VPN 👀 <<<$(NC)" && \
	echo "$(BLUE)> Log into vault$(NC)" && \
	vt vault login --env qa && \
	export VAULT_TOKEN=$$(cat ~/.vt/qa/vault/token | jq -r '.[0].token') && \
	echo "$(BLUE)> Create empty .env file$(NC)" && \
	echo '' > .env && \
	echo "$(BLUE)> Loading fixed configurations$(NC)" && \
	echo "BACKEND_BUCKET=\"qa-backstage\"" >> .env && \
	echo "NOMAD_ALLOC_INDEX=0" >>.env && \
	echo "BADGES_BUCKET=\"zf-dashboard-media-qa\"" >>.env && \
	echo "BADGES_BUCKET_REGION=\"us-west-2\"" >>.env && \
	echo "AWS_REGION=\"us-west-2\"" >>.env && \
	echo "$(BLUE)> Log into aws$(NC)" && \
	vt aws login --aws-role aws-s3-developer && \
	echo "AWS_ACCESS_KEY_ID=\"$$(aws configure get aws_access_key_id --profile aws-s3-developer)\"" >> .env && \
	echo "AWS_SECRET_ACCESS_KEY=\"$$(aws configure get aws_secret_access_key --profile aws-s3-developer)\"" >> .env && \
	echo "$(BLUE)> Get Grafana secrets$(NC)" && \
	export GRAFANA_TOKEN_SECRET=$$(curl -s --request GET --header "X-Vault-Token: $$(echo $$VAULT_TOKEN)" https://vault-qa.zerofox.com/v1/secret/backstage-local/grafana) && \
	echo "GRAFANA_TOKEN=\"$$(echo $$GRAFANA_TOKEN_SECRET | jq -r '.data.token')\"" >> .env && \
	echo "$(BLUE)> Get Data catalog secrets$(NC)" && \
	export DATA_CATALOG_SECRET=$$(curl -s --request GET --header "X-Vault-Token: $$(echo $$VAULT_TOKEN)" https://vault-qa.zerofox.com/v1/secret/backstage-local/datacatalog) && \
	echo "DATA_CATALOG_TOKEN=\"$$(echo $$DATA_CATALOG_SECRET | jq -r '.data.token')\"" >> .env && \
	echo "$(BLUE)> Get Nomad secrets$(NC)" && \
	export NOMAD_TOKEN_SECRET=$$(curl -s --request GET --header "X-Vault-Token: $$(echo $$VAULT_TOKEN)" https://vault-qa.zerofox.com/v1/nomad/creds/backstage) && \
	echo "NOMAD_TOKEN=\"$$(echo $$NOMAD_TOKEN_SECRET | jq -r '.data.secret_id')\"" >> .env && \
	echo "$(BLUE)> Loading GitHub secrets$(NC)" && \
	export GITHUB_SECRETS=$$(curl -s --request GET --header "X-Vault-Token: $$(echo $$VAULT_TOKEN)" https://vault-qa.zerofox.com/v1/secret/backstage-local/github) && \
	echo "AUTH_GITHUB_CLIENT_SECRET=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_secret')\"" >> .env && \
	echo "AUTH_GITHUB_CLIENT_ID=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_id')\"" >> .env && \
	echo "GITHUB_CLIENT_ID=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_id')\"" >> .env && \
	echo "GITHUB_APP_ID=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_app_id')\"" >> .env && \
<<<<<<< HEAD
	printf "GITHUB_APP_PRIVATE_KEY=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_private_key' | awk '{printf "%s\\\\n", $$0}' | sed ':a;N;$$!ba;s/\n/\\\\n/g')\"\n" >> .env && \
=======
	echo "GITHUB_APP_PRIVATE_KEY=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_private_key' | sed -e ':a' -e 'N' -e '$$!ba' -e 's/\n/\\\\n/g' | tr -d '\n')\"" >> .env && \
>>>>>>> 1705b8fcd6 (Fix Pillar not found on github entity)
	echo "GITHUB_APP_SECRET=\"$$(echo $$GITHUB_SECRETS | jq -r '.data.local_client_secret')\"" >> .env

run-local-docker: run-load-credentials
	@docker compose up local

run-local: run-load-credentials
<<<<<<< HEAD
	@source .env && env && yarn dev
=======
	@export $(shell cat .env) && yarn dev
>>>>>>> 1705b8fcd6 (Fix Pillar not found on github entity)
