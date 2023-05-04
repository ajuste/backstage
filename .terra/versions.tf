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

provider "consul" {
  address    = "consul-${var.env}.zerofox.com:443"
  datacenter = "aws-${var.aws_region}"
  scheme     = "https"
}

# this needs to be pinned, otherwise it upgrades to v3.2. 
# this version breaks terraform plan with UpgradeResourceState error (see https://discuss.hashicorp.com/t/error-unable-to-read-previously-saved-state-for-upgraderesourcestate/46962/5)
# once we upgrade to 0.12 we should revisit, as I think this provider will not be necessary
provider "null" {
  version = "~> 2.0"
}

provider "nomad" {
  version = "~> 1.0"
  address = "https://nomad-${var.env}.zerofox.com"
  region  = "global"
}