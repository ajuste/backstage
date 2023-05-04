terraform {
  backend "s3" {
    key = "backstage/terraform.tfstate"
  }

  required_version = "0.12.31"
}

provider "aws" {
  region  = var.aws_region
  version = "~> 3.0"
}

provider "nomad" {
  version = "~> 1.0"
  address = "https://nomad-${var.env}.zerofox.com"
  region  = "global"
}