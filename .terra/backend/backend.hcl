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
      cpu    = "2000"
      memory = "2048"

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
TECHDOCS_AWSS3_BUCKET_NAME=${bucket_name}
{{ with secret "secret/${app}/github" }}
AUTH_GITHUB_CLIENT_ID="{{ .Data.client_id }}"
AUTH_GITHUB_CLIENT_SECRET="{{ .Data.client_secret }}"
GITHUB_ACCESS_TOKEN="{{ .Data.access_token }}"
GITHUB_TOKEN="{{ .Data.access_token }}"
{{ end }}
{{ with secret "secret/${app}/jira" }}
JIRA_TOKEN="{{ .Data.token }}"
{{ end }}
{{ with secret "secret/${app}/grafana" }}
GRAFANA_TOKEN="{{ .Data.token }}"
{{ end }}
{{ with secret "aws/sts/backstage" "ttl=24h" }}
AWS_REGION="us-west-2"
AWS_ACCESS_KEY_ID="{{ .Data.access_key }}"
AWS_SECRET_ACCESS_KEY="{{ .Data.secret_key }}"
AWS_SESSION_TOKEN="{{ .Data.security_token }}"
{{ end }}
{{ with secret "database/backstage/creds/admin" }}
DB_HOST=${db_address}
DB_USER="{{ .Data.username }}"
DB_PASSWORD="{{ .Data.password }}"
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
      source      = "/nomad/templates/vault.crt.ctmpl"
      destination = "$${NOMAD_TASK_DIR}/vault.crt"
      change_mode = "restart"
    }
  }
}
