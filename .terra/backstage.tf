//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// backstage
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

terraform {
  backend "s3" {
    key = "backstage/terraform.tfstate"
  }

  required_version = "0.11.15"
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Variables
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

variable "app" {
  default = "backstage"
}

variable "aws_region" {
  default = "us-west-2"
}

variable "consul_token" {
  default = ""
}

variable "ecr_url" {
  default = "012321959326.dkr.ecr.us-west-2.amazonaws.com"
}

variable "env" {
  default = "qa"
}

variable "git_sha" {
  default = "master"
}

provider "nomad" {
  version = "1.4.11"
  address = "https://nomad-${var.env}.zerofox.com"
  region  = "global"
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Database
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

locals {
  db_instance_identifier = {
    qa   = "backstage-qa"
    stag = "backstage-stag"
    prod = "backstage-prod"
  }
}

data "aws_db_instance" "backstage" {
  db_instance_identifier = "${lookup(local.db_instance_identifier, var.env)}"
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Providers
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

provider "aws" {
  region = "${var.aws_region}"
}

provider "consul" {
  address    = "consul-${var.env}.zerofox.com:443"
  datacenter = "aws-${var.aws_region}"
  scheme     = "https"
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Components
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

module "backend" {
  source = "./backend"

  app          = "${var.app}"
  aws_region   = "${var.aws_region}"
  consul_token = "${var.consul_token}"
  ecr_url      = "${var.ecr_url}"
  env          = "${var.env}"
  git_sha      = "${var.git_sha}"
  db_address   = "${data.aws_db_instance.backstage.address}"
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Deployment
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

data "template_file" "nomad_job_spec" {
  template = "${file("backstage.nomad.hcl")}"

  vars {
    app        = "${var.app}"
    aws_region = "${var.aws_region}"

    backend = "${module.backend.nomad_group}"
  }
}

module "nomad-job" {
  source            = "git::ssh://git@github.com/riskive/devops-terraform-modules.git?ref=master//components/nomad-build-run"
  app               = "${var.app}"
  ecr_url           = "${var.ecr_url}"
  git_sha           = "${var.git_sha}"
  rendered_template = "${data.template_file.nomad_job_spec.rendered}"
}
