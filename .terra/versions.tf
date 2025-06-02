terraform {
  backend "s3" {
    key = "backstage/terraform.tfstate"
  }

  required_version = ">= 0.13"
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    nomad = {
      source = "hashicorp/nomad"
    }
    template = {
      source = "hashicorp/template"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "nomad" {
  address = "https://nomad-${var.env}.zerofox.com"
  region  = "global"
}