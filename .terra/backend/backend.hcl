group "backend" {
  count = "${count}"

  meta {
    group = "$${NOMAD_GROUP_NAME}"
    lang  = "typescript"
  }

  task "backend" {
    driver         = "docker"
    shutdown_delay = "10s"

    meta {
      index_name    = "backstage-backend"
      index_type    = "nodejs"
      node_filebeat = true
    }

    config {
      image   = "${ecr_url}/zf/${app}:${git_sha}"
      command = "node"

      port_map = {
        app         = 3000
        backend     = 7007
        backend_web = 8080
      }

      args = [
        "packages/backend",
        "--config",
        "app-config.yaml",
        "--config",
        "${config_file}"
      ]
    }

    resources {
      cpu    = "6000"
      memory = "4096"

      network {
        mbits = 1
        port "app" {}
        port "backend" {}
      }
    }

    service {
      name = "${app}-$${NOMAD_TASK_NAME}"
      port = "backend"
      tags = [
        "https",
        "cs=zerofox",
        "urlprefix-${subdomain}.zerofox.com/ proto=http",
        "traefik.http.routers.${app}-$${NOMAD_TASK_NAME}=redirect-to-https@file",
        "traefik.http.routers.${app}-$${NOMAD_TASK_NAME}.rule=Host(`${subdomain}.zerofox.com`)",
        "traefik.http.routers.${app}-$${NOMAD_TASK_NAME}.service=${app}-$${NOMAD_TASK_NAME}",
        "traefik.http.routers.${app}-$${NOMAD_TASK_NAME}-https.rule=Host(`${subdomain}.zerofox.com`)",
        "traefik.http.routers.${app}-$${NOMAD_TASK_NAME}-https.service=${app}-$${NOMAD_TASK_NAME}",
        "traefik.http.routers.${app}-$${NOMAD_TASK_NAME}-https.tls=true",
        "no-scrape"
      ]

      check {
        type     = "script"
        command  = "pidof"
        args     = ["node"]
        interval = "30s"
        timeout  = "2s"
      }
    }

    vault {
      policies    = ["${app}"]
      change_mode = "restart"
    }

    template {
      data        = <<EOH
{{ range ls "${app}/backend/env" }}
{{ .Key }}="{{ .Value }}"
{{ end }}
ENV=${env}
TECHDOCS_AWSS3_BUCKET_NAME=${bucket_name}
BACKEND_BUCKET=${backend_bucket}
BADGES_BUCKET=${badges_bucket}
BADGES_BUCKET_REGION=${badges_bucket_region}

# for reading git repositories from GitHub, using GitHub for auth
{{ with secret "secret/${app}/github" }}
AUTH_GITHUB_CLIENT_ID="{{ .Data.client_id }}"
AUTH_GITHUB_CLIENT_SECRET="{{ .Data.client_secret }}"
GITHUB_APP_ID="{{ .Data.app_id }}"
GITHUB_CLIENT_ID="{{ .Data.client_id }}"
GITHUB_APP_SECRET="{{ .Data.client_secret }}"
GITHUB_APP_PRIVATE_KEY="{{ .Data.private_key }}"
{{ end }}

# for reading git repositories in Azure DevOps (IDX)
{{ with secret "secret/${app}/azure" }}
AZURE_TOKEN="{{ .Data.access_token }}"
{{ end }}

# for reading tickets from JIRA
{{ with secret "secret/${app}/jira" }}
JIRA_TOKEN="{{ .Data.token }}"
JIRA_USER="{{ .Data.user }}"
JIRA_PASSWORD="{{ .Data.password }}"
{{ end }}

# for reading dashboards, alerts from Grafana
{{ with secret "secret/${app}/grafana" }}
GRAFANA_TOKEN="{{ .Data.token }}"
{{ end }}

# for accessing AWS resources (S3)
{{ with secret "aws/sts/backstage" "ttl=24h" }}
AWS_REGION="us-west-2"
AWS_ACCESS_KEY_ID="{{ .Data.access_key }}"
AWS_SECRET_ACCESS_KEY="{{ .Data.secret_key }}"
AWS_SESSION_TOKEN="{{ .Data.security_token }}"
{{ end }}

# for accessing RDS database
{{ with secret "database/backstage/creds/admin" }}
DB_HOST=${db_address}
DB_USER="{{ .Data.username }}"
DB_PASSWORD="{{ .Data.password }}"
{{ end }}

# for using Okta for SSO
{{ with secret "secret/${app}/okta" }}
AUTH_OKTA_CLIENT_ID="{{ .Data.client_id }}"
AUTH_OKTA_CLIENT_SECRET="{{ .Data.client_secret }}"
{{ end }}

# for Nomad authentication
{{ with secret "nomad/creds/backstage" }}
NOMAD_TOKEN="{{ .Data.secret_id }}"
{{ end }}

# openAPI
{{ with secret "secret/backstage/openapi" }}
OPENAI_API_KEY="{{ .Data.key }}"
{{end}
EOH
      destination = "$${NOMAD_SECRETS_DIR}/env"
      change_mode = "restart"
      env         = true
    }
  }
}
