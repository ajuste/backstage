terraform {
  backend "s3" {
    key = "backstage/terraform.tfstate"
  }

  required_version = "~>1.8.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.99.1"
    }
    nomad = {
      source  = "hashicorp/nomad"
      version = "~> 1.4.20"
    }
    template = {
      source  = "hashicorp/template"
      version = "~> 2.2.0"
    }

    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.4"
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