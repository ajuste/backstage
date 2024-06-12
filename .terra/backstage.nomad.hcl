job "backstage" {
  datacenters = ["aws-${aws_region}-customer"]
  type        = "service"

  meta {
    lang = "node"
    proj = "${app}"
  }

  update {
    max_parallel     = 1
    min_healthy_time = "10s"
    healthy_deadline = "15m"
    progress_deadline = "15m"
  }

  ${backend}
}
