# Lightstep Metrics Plugin

The Lightstep Metrics Plugin allows you to view metrics from Lightstep directly in Grafana. With minimal effort, you can use the plugin to continue viewing your existing visualizations in Grafana, using Lightstep as the data source. Then when you notice a deviation, you can click in a chart in Grafana and navigate into Lightstep to use [Change Intelligence](https://docs.lightstep.com/docs/investigate-metric-deviation) and uncover the root cause.

![Start Change Intelligence from Grafana](https://github.com/lightstep/lightstep-metrics-datasource/raw/main/images/docs/graf_metciStart.png)

Change Intelligence determines the service that emitted a metric, searches for performance changes on Key Operations from that service at the same time as the deviation, and then uses trace data to determine what caused the change.

![Change Intelligence in Lightstep](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/metci_changeIntel.png)

**NOTE:** _The Lightstep Metrics Plugin is on a per-project basis. If you want this integration for multiple Lightstep projects, follow these instructions for each of your projects._

## Prerequisites

You'll need the following to enable and use the plugin:

- A Grafana account (version 7.2.2 and greater)

  **NOTE:** _The plugin only supports graph and time series charts._

- [Metric data](https://docs.lightstep.com/docs/send-metrics-to-lightstep) reporting to Lightstep.

  Currently using Prometheus? You can use the [Prometheus sidecar](https://docs.lightstep.com/docs/ingest-metrics-prometheus) to send metrics to Lightstep. Lightstep also accepts metrics from other [backends](https://docs.lightstep.com/docs/send-metrics-to-lightstep).

- Your Organization and Project name. Both can be found on on the [Project Settings page](https://docs.lightstep.com/docs/create-projects-for-your-environments) of Lightstep.

  ![Project settings](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/proj_org.png)

- A Lightstep [API key](https://docs.lightstep.com/docs/create-and-manage-api-keys) with Viewer permissions created just for Grafana.

  Paste the key someplace safe, as you will not be able to access it again from Lightstep.

## Installation

You can install the plugin using the Grafana CLI, or if your Grafana server doesn't have internet access, you can download and instal it manually.

### Install from the CLI

Install the plugin from the Grafana CLI using [Grafana's plugin installation instructions](https://grafana.com/docs/grafana/latest/plugins/installation/).

```sh
grafana-cli plugins install lightstep-metrics-datasource
```

### Install Manually

1. Download the zip file from GitHub.

   ```sh
   https://github.com/lightstep/lightstep-metrics-datasource/archive/refs/heads/main.zip
   ```

2. Install the plugin by extracting the archive to the Grafana `grafana-plugins` directory.

## Enable the Lightstep Plugin in Grafana

After you install the plugin, follow these steps:

Steps may vary slightly depending on your version of Grafana.

1. Restart the Grafana server so it can discover the new plugin.
2. In the Navigation Bar, choose **Configuration**, select **Data Sources**, and click **Add data source**.

   ![Data Source](https://github.com/lightstep/lightstep-metrics-datasource/raw/main/images/docs/graf_metciData.png)

3. Start typing `Lightstep` in the search field to find the Lightstep Metrics plugin and click **Select**.

   ![Find Lightstep](https://github.com/lightstep/lightstep-metrics-datasource/raw/main/images/docs/graf_metciLS.png)

4. Enter your Lightstep organization and project name, paste in your Lightstep [API key](https://docs.lightstep.com/docs/create-and-manage-api-keys), and click **Save & Test**.

   Grafana confirms that it's connected to Lightstep.

   ![Test confirmation](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/graf_metciTest.png)

You can now create dashboards and charts in Grafana using metrics sent from Lightstep.


## Create Grafana Charts Using Metrics from Lightstep

With the Lightstep plugin installed, you can query your Lightstep metrics directly from Grafana.

1. In the Edit Panel view, make sure **Lightstep Metrics** is selected as the data source.

   ![Lightstep as data source](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/graf_metciSource.png)

2. Enter your query in the **Query Text** field and click **Run Query**.

   You can use Lightstep's Telemetry Query Language (TQL) or [PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/) for your query.

   ![Enter a query](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/graf_metciQuery.png)

3. Choose the visualization for the chart (Lightstep supports either **Graph** or **Time Series**). Click **Apply** to create the graph.

   ![Apply visualization](https://github.com/lightstep/lightstep-metrics-datasource/raw/main/images/docs/graf_metciApply.png)

## Investigate a Metric Deviation from a Grafana Chart

Now that you have a Grafana chart based on Lightstep metrics, when you notice a deviation, you can go directly from that chart into Lightstep to find the root cause.

When you view the chart and notice a deviation that you'd like to investigate, click into the deviation and select **View what changed in Lightstep**.

![Start Change Intelligence](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/graf_metciCI.png)

You're taken into Change Intelligence in Lightstep, where you can [start your investigation](https://docs.lightstep.com/docs/investigate-metric-deviation).

![Change Intelligence](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/graf_metciPW.png)

View the query you made in Grafana by clicking the **View query** button.

![View Grafana query](https://github.com/lightstep/lightstep-metrics-datasource/blob/main/images/docs/graf_metciViewQuery.png)

<!-- TODO: add a link to the Learning Path for Prom+Grafana, once available -->
