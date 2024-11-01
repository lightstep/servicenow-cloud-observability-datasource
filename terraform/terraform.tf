terraform {
  required_providers {
    grafana = {
      source = "grafana/grafana"
      version = "3.7.0"
    }
  }
}

provider "grafana" {
  url  = var.grafana_host
  auth = var.grafana_auth
}