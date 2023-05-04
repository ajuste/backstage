//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Variables
//<<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>

variable "app" {
  default = "backstage"
}

variable "aws_region" {
  default = "us-west-2"
}

variable "ecr_url" {
  default = "012321959326.dkr.ecr.us-west-2.amazonaws.com"
}

variable "env" {
  default = "qa"
}

variable "git_sha" {
  type    = string
  default = "master"
}