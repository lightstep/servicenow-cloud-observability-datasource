import { DataQuery, DataSourceJsonData } from '@grafana/data';

/**
 * The complete query definition needed to request data from the Lightstep API.
 */
export interface LightstepQuery extends DataQuery {
  projectName: string;
  /** The UQL query text string */
  text: string;
  /** Custom display query name for chart tooltip and legend */
  format: string;
  language: 'tql';
}

/**
 * The data source configuration options.
 */
export interface LightstepDataSourceOptions extends DataSourceJsonData {
  orgName: string;
  projectName: string;
  apiHost: string;
}

/**
 * Sensitive data source options that are stored in the Grafana backend.
 * @remarks
 * This is used to keep the Lightstep API key secret.
 */
export interface LightstepSecureJsonData {
  apiKey?: string;
}

// --------------------------------------------------------
// DATA SHAPES

export type QueryRes = QueryTimeseriesRes;

export interface QueryTimeseriesRes {
  data: {
    attributes: {
      series: Array<{
        'group-labels': string[];
        points: Point[];
      }>;
    };
  };
}

type Point = [timestamp: number, value: number];
