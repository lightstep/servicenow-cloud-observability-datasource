# Lightstep Observability Data Source

The Lightstep Observability Data Source allows you to view data from Lightstep directly in Grafana. You can use the plugin to visualize telemetry queries using Lightstep as the source of your telemetry data. And with Lightstep as your data source, you're able to directly drilldown into Lightstep Observability to root cause the issue of unexpected changes using advanced functionality like [Change Intelligence](https://docs.lightstep.com/docs/investigate-metric-deviation).

(🚧 UPDATE IMAGE)
![Start Change Intelligence from Grafana](./images/docs/graf_metciStart.png)

## Prerequisites

You'll need the following to enable and use the plugin:

- A Grafana account (version 7 and greater)

  **NOTE:** _The plugin only supports graph and time series charts._

- [Telemetry data](https://docs.lightstep.com/docs/welcome-to-lightstep) reporting to Lightstep.

- Your Lightstep "Organization" and "Project" name. Both can be found on on the [Project Settings page](https://docs.lightstep.com/docs/create-projects-for-your-environments) of Lightstep.

  ![Project settings](./images/docs/proj_org.png)

- A Lightstep [API key](https://docs.lightstep.com/docs/create-and-manage-api-keys) with Viewer permissions created just for Grafana.

  Paste the key someplace safe, as you will not be able to access it again from Lightstep.

## Installation

### Recommended: Install directly from GitHub

1. Download the zip file for the version you want from GitHub releases page:

   ```
   https://github.com/lightstep/lightstep-observability-datasource/releases
   ```

Follow the steps for installation in the Grafana documentation: https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-plugin-on-local-grafana

### Install using the Grafana CLI

1. Install the plugin from the Grafana CLI using [Grafana's plugin installation instructions](https://grafana.com/docs/grafana/latest/plugins/installation/).

   ```sh
   grafana-cli plugins install lightstep-observability-datasource
   ```

## Enable the Lightstep Observability Data Source in Grafana

After you install the plugin, follow these steps. Steps may vary slightly depending on your version of Grafana.

1. Restart the Grafana server so it can discover the new plugin.
2. In the Navigation Bar, choose **Configuration**, select **Data Sources**, and click **Add data source**.

   ![Data Source](./images/docs/graf_metciData.png)

3. Start typing `Lightstep` in the search field to find the Lightstep Observability data source and click **Select**. If you do not see the Lightstep plugin listed, please ensure it has been correctly installed or reach out to the Lightstep team for further assistance.

4. Enter your Lightstep organization and project name. If you want to use the data source with multiple projects, enter the name of each project separated by a comma into the project name field. Then paste in your Lightstep [API key](https://docs.lightstep.com/docs/create-and-manage-api-keys) and click **Save & Test**.

   Grafana confirms that it's connected to Lightstep.

   ![Test confirmation](./images/docs/graf_metciTest.png)

You can now create dashboards and charts in Grafana using data provided by your Lightstep project.

## Create Grafana Charts from Lightstep Observability

With the Lightstep plugin installed, you can query your Lightstep data directly from Grafana.

1. When in the Edit Panel view, under the "Query" tab, select the Lightstep Observability data source from the "Data source" drop down.

2. Add query in the text input, using the [Lightstep's Unified Query Language (UQL)](). (🚧 LINK NEEDED 🚧)

   Click out of the field (or press `shift` + `Enter`) to run your query.

   ![Enter a query](./images/docs/telemetry_graph.png)

3. Choose the visualization for the chart (Lightstep supports either **Graph** or **Time Series**). Click **Apply** to create the graph.

## Investigate a Deviation from a Grafana Chart

Now that you have a chart in Grafana, when you notice a unexpected change in your data, you can investigate in Lightstep to rapidly find the root cause.

To investigate, click into the deviation and select **View what changed in Lightstep**.

![Start Change Intelligence](./images/docs/graf_metciCI.png)

You're taken into Change Intelligence in Lightstep, where you can [start your investigation](https://docs.lightstep.com/docs/investigate-metric-deviation).

![Change Intelligence](./images/docs/graf_metciPW.png)

View the query you made in Grafana by clicking the **View query** button.

![View Grafana query](./images/docs/graf_metciViewQuery.png)

## Developing and testing the plugin with Docker

The `Makefile` in this repository contains a `make dev` target that builds this plugin and uses `docker-compose` to run a new instance of Grafana for development and testing.

When run the local development instance of Grafana should be available at [localhost:3000](http://localhost:3000/).

1. As with most Grafana Docker images, the default login/password is `admin`/`admin`.
2. Go to Settings > "Lightstep Provisioned Datasource" and set the Project Name, API host, and API key (based on your Lightstep account). "Save & test" the configuration.
3. Create a new Dashboard with a new Panel, select "Lightstep Provisioned Datasource" as the Data source and enter a query.

Note: the Makefile creates a local docker volume `grafana-data-lmd` to persist settings across launches so configuration is necessarily only on the first run.
