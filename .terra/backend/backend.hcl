group "backend" {
  count = "${count}"

  meta {
    group = "$${NOMAD_GROUP_NAME}"
    lang  = "typescript"
  }

  task "backend" {
    driver         = "docker"
    shutdown_delay = "10s"

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

# for reading git repositories from GitHub, using GitHub for auth
{{ with secret "secret/${app}/github" }}
AUTH_GITHUB_CLIENT_ID="{{ .Data.client_id }}"
AUTH_GITHUB_CLIENT_SECRET="{{ .Data.client_secret }}"
GITHUB_ACCESS_TOKEN="{{ .Data.access_token }}"
GITHUB_TOKEN="{{ .Data.access_token }}"
{{ end }}

# for reading git repositories in Azure DevOps (IDX)
{{ with secret "secret/${app}/azure" }}
AZURE_TOKEN="{{ .Data.access_token }}"
{{ end }}

# for reading tickets from JIRA
{{ with secret "secret/${app}/jira" }}
JIRA_TOKEN="{{ .Data.token }}"
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
EOH
      destination = "$${NOMAD_SECRETS_DIR}/env"
      change_mode = "restart"
      env         = true
    }
  }

  task "filebeat" {
    driver = "docker"

    env {
      common_name = "${app}.$${NOMAD_GROUP_NAME}.$${NOMAD_TASK_NAME}"
      index_name  = "${app}-$${NOMAD_GROUP_NAME}"
      task_log    = "${app}-$${NOMAD_GROUP_NAME}"
    }

    config {
      image = "${ecr_url}/zf/filebeat:master"
    }

    resources {
      cpu    = "64"
      memory = "128"

      network {
        mbits = 1
      }
    }

    service {
      name = "$${NOMAD_TASK_NAME}"
      tags = ["${app}.$${NOMAD_GROUP_NAME}"]

      check {
        name     = "Filebeat check"
        type     = "script"
        command  = "pidof"
        args     = ["filebeat"]
        interval = "10s"
        timeout  = "2s"
      }
    }

    vault {
      policies    = ["filebeat"]
      change_mode = "restart"
    }

    template {
      source      = "/nomad/templates/client.bundle.pem.ctmpl"
      destination = "$${NOMAD_SECRETS_DIR}/client.bundle.pem"
      change_mode = "restart"
    }

    template {
      source      = "/nomad/templates/vault-core.crt.ctmpl"
      destination = "$${NOMAD_TASK_DIR}/vault.crt"
      change_mode = "noop"
    }
  }
}
