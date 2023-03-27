import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldConfig,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { config, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { stringify } from 'qs';

import { LightstepDataSourceOptions, LightstepQuery } from './types';
import { intervalToSeconds } from './rangeUtilPolyfill';

// Internal types for this class
type QueryResponse = {
  data: { attributes: { series: Series[] } };
};
type Series = {
  'group-labels': string[];
  points: Point[];
};
type Point = [number, number];
type SimpleField = {
  config?: FieldConfig;
  name: string;
  type: FieldType;
  values: number[];
  labels?: { [key: string]: string };
};

const clickMillisPlaceholder = '_click_millis_placeholder_';

export class DataSource extends DataSourceApi<LightstepQuery, LightstepDataSourceOptions> {
  projectName: string;
  orgName: string;
  url?: string;
  pluginID: string;

  constructor(instanceSettings: DataSourceInstanceSettings<LightstepDataSourceOptions>) {
    super(instanceSettings);

    this.projectName = instanceSettings.jsonData.projectName || '';
    this.orgName = instanceSettings.jsonData.orgName || '';
    this.url = instanceSettings.url || '';
    this.pluginID = instanceSettings.meta.id || 'lightstep-metrics-datasource';
  }

  /**
   * `frames` will eventually look like the following:
   * [
   *   { name: 'Time', type: FieldType.time, values: [1614196620000, 1614196650000, 1614196680000] },
   *   { name: "{ customer: 'cat-face' }", type: FieldType.number, values: [6, 9, 12] },
   *   { name: "{ customer: 'dog-face' }", type: FieldType.number, values: [16, 19, 112] },
   * ]
   *
   * This format effectively creates "Wide format" data frames, where each field
   * shares the same time index. To quote the docs: "By reusing the time field,
   * we can reduce the amount of data being sent to the browser."
   * See https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/#wide-format
   */
  async query(options: DataQueryRequest<LightstepQuery>): Promise<DataQueryResponse> {
    // Make requests for non-empty, non-hidden queries
    const visibleTargets = options.targets.filter((query) => query.text && !query.hide);
    const queryRequests = visibleTargets.map((query) => this.doRequest(query, options));
    let queries: QueryResponse[];

    // Gather our response data
    try {
      queries = await Promise.all(queryRequests);
    } catch (error: any) {
      if (error && error.data && error.data.errors && error.data.errors.length > 0) {
        // display the first error
        throw { message: error.data.errors[0] };
      } else {
        throw error;
      }
    }

    return { data: this.buildQuery(queries, visibleTargets, options) };
  }

  /**
   * @param queries Fetched API data
   * @param visibleTargets Populated queries that should be displayed in panel
   * @param options The complete set of panel options, including time range, template variables, query, etc.
   */
  buildQuery(queries: QueryResponse[], visibleTargets: LightstepQuery[], options: DataQueryRequest<LightstepQuery>) {
    // Declare the variables that we'll use in our nested loops.
    const frames: DataFrame[] = [];
    let field: SimpleField;
    let fields: SimpleField[];
    let timestampIndex: number | undefined;
    let timestamps: number[];
    let timestampToIndexMap: Map<number, number>;

    // Aggregate data frames and fields for each query.
    // Cheat sheet:
    // Grafana data frame ~= Lightstep query
    // Grafana field ~= Lightstep series
    queries.forEach((query, i) => {
      // If this is an empty query, bail 👋
      if (!query.data.attributes.series) {
        return;
      }

      timestamps = generateSortedTimestamps(query);
      timestampToIndexMap = generateTimestampMap(timestamps);

      // Every data frame needs a time Field, which we add here during assignment
      fields = [{ name: 'Time', type: FieldType.time, values: timestamps }];

      query.data.attributes.series.forEach((series: Series) => {
        // Build out URL for Lightstep Chart Relay page
        const queryString = this.notebookQueryFields(visibleTargets, options, this.pluginID);
        // Use Grafana's variable interpolation to get click time
        const stringifiedQueryString = stringify(queryString).replace(clickMillisPlaceholder, '${__value.time}');

        // Each series will get its own Field
        // The field's values are initially set to `null`. The actual values
        // will be set as we loop through the series' `points` below.
        field = {
          config: {
            links: [
              {
                url: `https://app.lightstep.com/${this.defaultProjectName()}/notebooks?${stringifiedQueryString}`,
                targetBlank: true,
                title: 'Create a Notebook in Lightstep',
              },
            ],
          },
          name: createFieldName(visibleTargets[i].format, visibleTargets[i].text, series['group-labels'], options),
          type: FieldType.number,
          values: new Array(timestamps.length).fill(null),
        };

        // API will currently return undefined for series.points for series without
        // data instead of an empty array
        if (series.points) {
          series.points.forEach(([timestamp, value]) => {
            timestampIndex = timestampToIndexMap.get(timestamp);

            if (timestampIndex !== undefined) {
              field.values[timestampIndex] = value;
            }
          });
        }

        fields.push(field);
      });

      // Each query gets its own DataFrame
      frames.push(
        new MutableDataFrame({
          fields,
          refId: visibleTargets[i].refId,
        })
      );
    });
    return frames;
  }

  async doRequest(query: LightstepQuery, options: DataQueryRequest): Promise<any> {
    const { email } = config.bootData.user;
    const hashedEmail = await hashEmail(email);
    const queryWithVars = getTemplateSrv().replace(query.text, options.scopedVars);
    const attributes = {
      'oldest-time': options.range.from,
      'youngest-time': options.range.to,
      query: queryWithVars,
      'input-language': query.language,
      'output-period': intervalToSeconds(options.interval),
    };
    return getBackendSrv().post(this.projectUrl(query.projectName, '/telemetry/query_timeseries'), {
      data: {
        attributes,
        anonymized_user: hashedEmail,
        grafana_version: config.buildInfo.version,
        query_source: 'grafana',
      },
    });
  }

  notebookQueryFields(visibleTargets: LightstepQuery[], options: DataQueryRequest<LightstepQuery>, pluginID: string) {
    const tql_query = visibleTargets.map((target) => getTemplateSrv().replace(target.text, options.scopedVars));
    const queryString = {
      tql_query,
      title: 'Grafana Chart',
      start_micros: options.range.from.valueOf() * 1000,
      end_micros: options.range.to.valueOf() * 1000,
      click_millis: clickMillisPlaceholder,
      source: pluginID,
    };
    return queryString;
  }

  fetchProjects() {
    return this.projects();
  }

  hasMultipleProjects(): boolean {
    return this.projectName.indexOf(',') !== -1;
  }

  projects(): string[] {
    return this.projectName.split(',');
  }

  projectUrl(projectName: string, suffix: string): string {
    return `${this.url}/projects/${this.resolveProjectName(projectName)}${suffix}`;
  }

  resolveProjectName(projectName: string): string {
    return projectName ? projectName : this.defaultProjectName();
  }

  defaultProjectName(): string {
    return this.hasMultipleProjects() ? this.projects()[0] : this.projectName;
  }

  testDatasource() {
    // Reject if required fields are missing
    if (this.orgName === '') {
      return Promise.reject({ status: 'error', message: 'Organization name is required' });
    }
    if (this.defaultProjectName() === '') {
      return Promise.reject({ status: 'error', message: 'Project name is required' });
    }

    return getBackendSrv()
      .get(`${this.url}/test`)
      .then(() => ({ status: 'success', message: 'Data source is working' }))
      .catch((error) => {
        console.error(error);

        if (error.status === 403) {
          return { status: 'error', message: 'Invalid API key' };
        }

        return { status: 'error', message: error.data.message };
      });
  }
}

/**
 * Produces a sorted array of timestamps from every point in every series in the query.
 * @param  {QueryResponse} query
 */
export function generateSortedTimestamps(query: QueryResponse): number[] {
  const timestampSet = new Set<number>();

  query.data.attributes.series.forEach((series: Series) => {
    // API will currently return undefined for series.points for series without
    // data instead of an empty array
    if (series.points) {
      series.points.forEach(([timestamp]) => timestampSet.add(timestamp));
    }
  });

  return Array.from(timestampSet).sort((a, b) => a - b);
}
/**
 * Maps a timestamp's value to its index
 * @param  {Array<number>} timestamps
 * @returns {Map<number, number>}
 */
export function generateTimestampMap(timestamps: number[]): Map<number, number> {
  const timestampToIndexMap = new Map<number, number>();

  for (let i = 0; i < timestamps.length; i++) {
    timestampToIndexMap.set(timestamps[i], i);
  }

  return timestampToIndexMap;
}

/**
 * Generate a short, fixed-length value from the given message.
 * See https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
 * @param  {string} email
 */
async function hashEmail(email: string) {
  try {
    const msgUint8 = new TextEncoder().encode(email); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string

    return hashHex;
  } catch (error) {
    // Unable to hash email
    return '';
  }
}

export function createFieldName(
  format: string,
  queryText: string,
  groupLabels: string[] = [],
  options: DataQueryRequest<LightstepQuery>
) {
  let formattedLabels = '';
  if (groupLabels.length > 0) {
    formattedLabels = `{${groupLabels
      .sort((a, b) => a.localeCompare(b))
      // Surround label value in double quotes (e.g. 'key=value' => 'key="value"')
      .map((labelKeyAndValue) => labelKeyAndValue.replace('=', '="') + '"')
      .join(', ')}}`;
  }

  if (format) {
    return (
      getTemplateSrv().replace(format, options?.scopedVars) + (formattedLabels.length > 0 ? ' ' + formattedLabels : '')
    );
  }

  if (groupLabels.length > 0) {
    return formattedLabels;
  }

  return queryText;
}
