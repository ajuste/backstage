//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Locals
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

locals {
  container_count = {
    qa   = 1
    stag = 1
    prod = 3 # HA
  }

  subdomain = {
    qa   = "devportal-qa"
    stag = "devportal-stag"
    prod = "devportal"
  }

  database_host = {
    qa   = "rds-qa.zerofox.com"
    stag = "rds-s.zerofox.com"
    prod = "rds.zerofox.com"
  }

  config_file = {
    qa   = "app-config.qa.yaml"
    stag = "app-config.staging.yaml"
    prod = "app-config.production.yaml"
  }

  badges_bucket = {
    qa   = "zf-dashboard-media-qa"
    stag = "zf-platform-media-staging"
    prod = "zf-dashboard-media"
  }
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// AWS Resources
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

resource "aws_iam_role" "iam_role" {
  name = "${var.app}-${var.env}-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_s3_bucket" "backstage" {
  acl    = "private"
  bucket = "${var.env}-backstage"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Application = var.app
    Environment = var.env
  }
}

resource "aws_s3_bucket" "techdocs" {
  acl    = "private"
  bucket = "${var.env}-backstage-docs"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Application = var.app
    Environment = var.env
  }
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Nomad
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

data "template_file" "nomad_group" {
  template = file("./backend/backend.hcl")

  vars = {
    app            = var.app
    aws_region     = var.aws_region
    count          = local.container_count[var.env]
    database_host  = local.database_host[var.env]
    ecr_url        = var.ecr_url
    env            = var.env
    git_sha        = var.git_sha
    config_file    = local.config_file[var.env]
    bucket_name    = aws_s3_bucket.techdocs.id
    bucket_region  = aws_s3_bucket.techdocs.region
    subdomain      = local.subdomain[var.env]
    db_address     = var.db_address
    backend_bucket = "${var.env}-backstage"
    badges_bucket  = local.badges_bucket[var.env]
  }
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Output
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

output "nomad_group" {
  value = data.template_file.nomad_group.rendered
}
