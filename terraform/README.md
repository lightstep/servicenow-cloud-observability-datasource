# Terraform Grafana Example

This is an example of how you can use Terraform to create:

- A Service Cloud Observability datasource
- A dashboard with template variables and spans and logs panels


To run:

```
terraform apply -var-file=vars.tfvars  
```

Where the `vars.tfvars` specifies Grafana service account token and Cloud Observability API token:

```
grafana_auth = "<service-account-token>"
lighstep_api_key = "<cloud-observability-api-token>"
```