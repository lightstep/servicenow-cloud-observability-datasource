resource "grafana_data_source" "demo" {
  type                = "servicenow-cloudobservability-datasource"
  name                = "demo"
  uid                 = "snco-demo-ds-test-uid"
  url                 = "https://${var.lightstep_api_host}"
  json_data_encoded = jsonencode({
    orgName        = "LightStep"
    projectName    = "demo"
    apiHost        = var.lightstep_api_host
  })

  secure_json_data_encoded = jsonencode({
    apiKey = var.lighstep_api_key
  })
}


