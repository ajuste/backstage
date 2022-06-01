group "backend" {
  count = "${count}"

  meta {
    group = "$${NOMAD_GROUP_NAME}"
    lang  = "python"
  }

  task "backend" {
    driver         = "docker"
    shutdown_delay = "10s"

    config {
      image   = "${ecr_url}/zf/${app}:${git_sha}"
      command = "node"

      args = [
        "packages/backend",
        "--config app-config.yaml",
        "--config",
        "${config_file}"
      ]
    }

    resources {
      cpu    = "2000"
      memory = "2048"

      network {
        mbits = 1
        port "http" {}
      }
    }

    service {
      name = "${app}-$${NOMAD_TASK_NAME}"
      tags = ["no-scrape"]

      check {
        type     = "script"
        command  = "pidof"
        args     = ["node"]
        interval = "30s"
        timeout  = "2s"
      }
    }

    template {
      data        = <<EOH
{{ with secret "secret/${app}/github" }}
AUTH_GITHUB_CLIENT_ID="{{ .Data.client_id }}"
AUTH_GITHUB_CLIENT_SECRET="{{ .Data.client_secret }}"
GITHUB_ACCESS_TOKEN="{{ .Data.access_token }}"
{{ end }}
{{ range ls "${app}/backend/env" }}
{{ .Key|toUpper }}="{{ .Value }}"{{ end }}
EOH
      destination = "$${NOMAD_SECRETS_DIR}/env"
      change_mode = "restart"
      env         = true
    }

    vault {
      policies    = ["${app}"]
      change_mode = "restart"
    }
  }

  task "filebeat" {
    driver         = "docker"

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
