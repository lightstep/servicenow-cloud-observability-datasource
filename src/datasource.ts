import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  rangeUtil,
} from '@grafana/data';
import { config, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { preprocessData } from './preprocessors';
import { LightstepDataSourceOptions, LightstepQuery } from './types';

/**
 * THE DATASOURCE
 *
 * This class is the entry point for the plugin, and directly manages executing
 * queries against the Lightstep API.
 */
export class DataSource extends DataSourceApi<LightstepQuery, LightstepDataSourceOptions> {
  projectName: string;
  orgName: string;
  url: string;

  constructor(instanceSettings: DataSourceInstanceSettings<LightstepDataSourceOptions>) {
    super(instanceSettings);

    this.projectName = instanceSettings.jsonData.projectName || '';
    this.orgName = instanceSettings.jsonData.orgName || '';
    this.url = instanceSettings.url || '';
  }

  /**
   * Framework hook called by Grafana for each panel. Method is responsible for
   * fetching data for each of the "targets" (aka queries) in the request
   * options.
   * @remarks Grafana framework datasource hook
   */
  async query(request: DataQueryRequest<LightstepQuery>): Promise<DataQueryResponse> {
    try {
      const hashedEmail = await hashEmail(config.bootData.user.email);
      const projects = this.projects();

      // Project name check: Ensure that every query has a projectName defined, and that
      // the defined value is in the current datasource's configured set of projects.
      // nb: This is a required check when users have setup a datasource template variable
      request.targets.forEach((target) => {
        if (!projects.includes(target.projectName)) {
          target.projectName = this.defaultProjectName();
        }
      });

      // Only make requests for non-empty, non-hidden queries
      const visibleTargets = request.targets.filter((query) => query.text && !query.hide);

      const projectName = visibleTargets[0].projectName;
      const notebookURL = createNotebookURL(request, visibleTargets, projectName);

      const requests = visibleTargets.map(async (query) => {
        const res = await getBackendSrv().post(`${this.url}/projects/${query.projectName}/telemetry/query_timeseries`, {
          data: {
            attributes: {
              query: getTemplateSrv().replace(query.text, request.scopedVars),
              'input-language': query.language,
              'oldest-time': request.range.from,
              'youngest-time': request.range.to,
              // query_timeseries minimum supported output-period is 1 second
              'output-period': Math.max(1, rangeUtil.intervalToSeconds(request.interval)),
            },
            analytics: {
              anonymized_user: hashedEmail,
              grafana_version: config.buildInfo.version,
              query_source: 'grafana',
            },
          },
        });

        return preprocessData(res, query, notebookURL);
      });

      return {
        data: await Promise.all(requests),
      };
    } catch (error: any) {
      if (error?.data?.errors && error.data.errors.length > 0) {
        // Rethrow with a specific error message to display in panel
        throw { message: error.data.errors[0] };
      }

      throw error;
    }
  }

  /**
   * Test & verify datasource settings & connection details
   * @remarks Grafana framework datasource hook
   */
  async testDatasource() {
    // Reject if required fields are missing
    if (this.orgName === '') {
      return { status: 'error', message: 'Organization name is required' };
    }
    if (this.defaultProjectName() === '') {
      return { status: 'error', message: 'Project name is required' };
    }

    try {
      await getBackendSrv().get(`${this.url}/test`);
      return {
        status: 'success',
        message: 'Data source is working',
      };
    } catch (err: any) {
      if (err?.status === 403) {
        return { status: 'error', message: 'Invalid API key' };
      }

      if (err?.data?.message) {
        return { status: 'error', message: err.data.message };
      }

      // REF: Unknown errors and HTTP errors can be re-thrown and will be
      // handled here: public/app/features/datasources/state/actions.ts
      throw err;
    }
  }

  // --------------------------------------------------------
  // QUERY EDITOR METHODS

  /** Return the set of configured project names for data source */
  projects(): string[] {
    // nb string replace removes optional whitespace between project names, eg:
    // "dev, pre-prod, prod" -> ["dev", "pre-prod", "prod"]
    return this.projectName.replace(/\s/g, '').split(',');
  }

  /** Returns the first configured project name for data source */
  defaultProjectName(): string {
    return this.projects()[0];
  }
}

/**
 * Create an *anonymous* unique id from user email
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
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

/**
 * Produces a URL for programatically creating an LS Notebook entry matching the
 * chart
 */
export function createNotebookURL(
  request: DataQueryRequest<LightstepQuery>,
  visibleTargets: LightstepQuery[],
  projectName: string
) {
  const queries = visibleTargets.map((target) => getTemplateSrv().replace(target.text, request.scopedVars));

  const searchParam = new URLSearchParams({
    version: '2',
    title: 'Grafana Chart',
    start_micros: String(request.range.from.valueOf() * 1000),
    end_micros: String(request.range.to.valueOf() * 1000),
    source: 'servicenow-cloudobservability-datasource',
  });

  queries.forEach((query) => {
    searchParam.append('query', query);
  });

  return `https://app.lightstep.com/${projectName}/notebooks?${searchParam.toString()}`;
}
