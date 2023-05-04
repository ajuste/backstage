//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// backstage
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

locals {
  db_instance_identifier = {
    qa   = "backstage-qa"
    stag = "backstage-stag"
    prod = "backstage-prod"
  }
}

data "aws_db_instance" "backstage" {
  db_instance_identifier = local.db_instance_identifier[var.env]
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Components
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

module "backend" {
  source = "./backend"

  app        = var.app
  aws_region = var.aws_region
  ecr_url    = var.ecr_url
  env        = var.env
  git_sha    = var.git_sha
  db_address = data.aws_db_instance.backstage.address
}

//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Deployment
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

data "template_file" "nomad_job_spec" {
  template = file("backstage.nomad.hcl")

  vars = {
    app        = var.app
    aws_region = var.aws_region
    backend    = module.backend.nomad_group
  }
}

module "nomad-job" {
  source            = "git::ssh://git@github.com/riskive/devops-terraform-modules.git//nomad-build-run?ref=master"
  app               = var.app
  ecr_url           = var.ecr_url
  git_sha           = var.git_sha
  rendered_template = data.template_file.nomad_job_spec.rendered
}
