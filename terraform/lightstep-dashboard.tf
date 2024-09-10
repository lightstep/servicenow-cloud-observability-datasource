locals {
  span_explorer = {
    targetBlank = true
    title =  "Go to Span Explorer"
    url = "https://app.lightstep.com/$${source}/service-directory/$${service:percentencode}/deployments?span_explorer=true&operation=$${__field.labels.operation}&start_micros=$${__from}000&end_micros=$${__to}000"
  }

  span_panel_link = {
    targetBlank = true
    title =  "View in LightStep"
    url = "https://app.lightstep.com/$${source}/service-directory/$${service}"
  }
}

resource "grafana_dashboard" "test" {
  config_json = jsonencode({
    "annotations": {
      "list": [
        {
          "builtIn": 1,
          "datasource": {
            "type": "grafana",
            "uid": "-- Grafana --"
          },
          "enable": true,
          "hide": true,
          "iconColor": "rgba(0, 211, 255, 1)",
          "name": "Annotations & Alerts",
          "type": "dashboard"
        }
      ]
    },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 0,
    "id": 2,
    "links": [],
    "liveNow": false,
    "panels": [
        {
        "gridPos": {
          "h": 1,
          "w": 24,
          "x": 0,
          "y": 0
        },
        "id": 3,
        "title": "Service: $${service}",
        "type": "row"
      },
      {
        "datasource": {
          "type": grafana_data_source.demo.type,
          "uid": grafana_data_source.demo.uid
        },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "links": [
              local.span_explorer
            ],
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            },
            "unit": "ops"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 6,
          "w": 8,
          "x": 0,
          "y": 1
        },
        "id": 1,
        "links": [
          local.span_panel_link
        ],
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": false
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "targets": [
          {
            "datasource": {
              "type": grafana_data_source.demo.type,
              "uid": grafana_data_source.demo.uid
            },
            "format": "{{service}} - {{operation}}",
            "projectName": "demo",
            "refId": "A",
            "text": "spans count | rate  | filter service == $service && operation == $operation | group_by [service, operation], sum | point value"
          }
        ],
        "title": "throughput",
        "type": "timeseries"
      },
      {
        "datasource": {
          "type": grafana_data_source.demo.type,
          "uid": grafana_data_source.demo.uid
        },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "links": [
              local.span_explorer
            ],
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            },
            "unit": "ms"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 6,
          "w": 7,
          "x": 8,
          "y": 1
        },
        "id": 2,
        "links": [
          local.span_panel_link
        ],
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": false
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "targets": [
          {
            "datasource": {
              "type": grafana_data_source.demo.type,
              "uid": grafana_data_source.demo.uid
            },
            "projectName": "demo",
            "refId": "A",
            "text": "spans latency | delta  | filter service == $service && operation == $operation| group_by [service, operation], sum | point percentile(value, 50)"
          }
        ],
        "title": "p50 latency",
        "type": "timeseries"
      },
      {
        "datasource": {
          "type": grafana_data_source.demo.type,
          "uid": grafana_data_source.demo.uid
        },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "links": [
              local.span_explorer
            ],
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            },
            "unit": "percent"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 6,
          "w": 8,
          "x": 15,
          "y": 1
        },
        "id": 4,
        "links": [
          local.span_panel_link
        ],
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": false
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "targets": [
          {
            "datasource": {
              "type": grafana_data_source.demo.type,
              "uid": grafana_data_source.demo.uid
            },
            "projectName": "demo",
            "refId": "A",
            "text": "with\n  error = spans count \n  \t| rate  \n\t| filter service == $service \n\t\t  && operation == $operation\n\t\t  && error == true\n\t| group_by [service, operation], sum;\n  total = spans count \n  \t| rate  \n\t| filter service == $service && operation == $operation \n\t| group_by [service, operation], sum;\njoin error / total * 100, error = 0"
          }
        ],
        "title": "error %",
        "type": "timeseries"
      },
      {
        "datasource": {
          "type": grafana_data_source.demo.type,
          "uid": grafana_data_source.demo.uid
        },
        "gridPos": {
          "h": 11,
          "w": 23,
          "x": 0,
          "y": 7
        },
        "id": 5,
        "options": {
          "dedupStrategy": "signature",
          "enableLogDetails": true,
          "prettifyLogMessage": false,
          "showCommonLabels": true,
          "showLabels": false,
          "showTime": true,
          "sortOrder": "Descending",
          "wrapLogMessage": false
        },
        "targets": [
          {
            "datasource": {
              "type": grafana_data_source.demo.type,
              "uid": grafana_data_source.demo.uid
            },
            "projectName": "demo",
            "refId": "A",
            "text": "logs | filter service.name == $service && contains(severity_text, 'error')"
          }
        ],
        "title": "Error Logs",
        "type": "logs"
      }
    ],
    "refresh": "",
    "schemaVersion": 38,
    "style": "dark",
    "tags": [],
    "templating": {
      "list": [
        {
          "current": {
            "selected": false,
            "text": "demo",
            "value": "demo"
          },
          "hide": 2,
          "includeAll": false,
          "multi": false,
          "name": "source",
          "options": [],
          "query": grafana_data_source.demo.type,
          "refresh": 1,
          "regex": "",
          "skipUrlSync": false,
          "type": "datasource"
        },
        {
          "current": {
            "selected": false,
            "text": "android",
            "value": "android"
          },
          "datasource": {
            "type": grafana_data_source.demo.type,
            "uid": grafana_data_source.demo.uid
          },
          "definition": "",
          "hide": 0,
          "includeAll": false,
          "multi": false,
          "name": "service",
          "options": [],
          "query": {
            "attributeKey": "service",
            "refId": "service"
          },
          "refresh": 1,
          "regex": "",
          "skipUrlSync": false,
          "sort": 0,
          "type": "query"
        },
        {
        "current": {
          "selected": true,
          "text": [
            "/api/get-catalog"
          ],
          "value": [
            "/api/get-catalog"
          ]
        },
        "datasource": {
            "type": grafana_data_source.demo.type,
            "uid": grafana_data_source.demo.uid
          },
        "definition": "",
        "hide": 0,
        "includeAll": true,
        "multi": true,
        "name": "operation",
        "options": [],
        "query": {
          "attributeKey": "operation",
          "refId": "operation",
          "scopeFilterExpression": "service == $service"
        },
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "sort": 0,
        "type": "query"
      }
      ]
    },
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "timepicker": {},
    "timezone": "",
    "title": "LightStep - Grafana Demo",
    "uid": "a2114ef9-e6f7-4917-9096-94ab8bab9670",
    "version": 10,
    "weekStart": ""
  })
}