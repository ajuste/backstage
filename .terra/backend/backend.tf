//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Variables
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

variable "app" {}

variable "aws_region" {}

variable "consul_token" {}

variable "ecr_url" {}

variable "env" {}

variable "git_sha" {}

variable "db_address" {}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Locals
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

locals {
  container_count = {
    qa   = 1
    stag = 1
    prod = 2
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

data "terraform_remote_state" "global" {
  backend = "s3"

  config = {
    bucket = "zf-terraform-global"
    key    = "global/terraform.tfstate"
    region = "${var.aws_region}"
  }
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
    Application = "${var.app}"
    Environment = "${var.env}"
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
    Application = "${var.app}"
    Environment = "${var.env}"
  }
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Consul keys
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
resource "consul_keys" "main" {
  datacenter = "aws-${var.aws_region}"
  token      = "${var.consul_token}"
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Nomad
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

data "template_file" "nomad_group" {
  template = "${file("./backend/backend.hcl")}"

  vars {
    app           = "${var.app}"
    aws_region    = "${var.aws_region}"
    count         = "${lookup(local.container_count, var.env)}"
    database_host = "${lookup(local.database_host, var.env)}"
    ecr_url       = "${var.ecr_url}"
    env           = "${var.env}"
    git_sha       = "${var.git_sha}"
    config_file   = "${lookup(local.config_file, var.env)}"
    bucket_name   = "${aws_s3_bucket.techdocs.id}"
    bucket_region = "${aws_s3_bucket.techdocs.region}"
    subdomain     = "${lookup(local.subdomain, var.env)}"
<<<<<<< HEAD
    db_endpoint   = "${var.db_endpoint}"
=======
    db_address    = "${var.db_address}"
>>>>>>> 6fcc4c3 (Configure db connection for qa/stag/prod)
  }
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Output
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

output "nomad_group" {
  value = "${data.template_file.nomad_group.rendered}"
}
