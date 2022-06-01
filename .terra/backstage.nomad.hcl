job "backstage" {
  datacenters = ["aws-${aws_region}-customer"]
  type        = "service"

  meta {
    lang = "node"
    proj = "${app}"
  }

  update {
    stagger      = "10s"
    max_parallel = 1
  }

  ${backend}
}
