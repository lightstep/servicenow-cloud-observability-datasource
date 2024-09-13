variable "grafana_auth" {
  type = string
}

variable "grafana_host" {
  type = string
  default = "http://localhost:3000"
}

variable "lighstep_api_key" {
  type = string
}

variable "lightstep_api_host" {
  type = string
  default = "api.lightstep.com"
}
