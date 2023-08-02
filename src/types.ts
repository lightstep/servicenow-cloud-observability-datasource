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

export type QueryRes = QueryLogsRes | QueryTimeseriesRes;

/**
 * Response shape for a timeseries query
 * @example metric requests | rate | group_by [customer], sum
 */
export interface QueryTimeseriesRes {
  data: {
    attributes: {
      series: Array<{
        'group-labels': string[];
        /** Array of timestamp, value tuples */
        points: Array<[timestamp: number, value: number]>;
      }>;
    };
  };
}

/**
 * Response shape for a logs query.
 * @example logs | filter tags.customer == "name"
 */
export interface QueryLogsRes {
  data: {
    attributes: {
      /** Array of timestamp, event tuples */
      logs: Array<
        [
          timestamp: number,
          event: {
            /** internal timestamp */
            _ts: number;
            observed_time: number;
            severity: 'InfoSeverity' | 'WarningSeverity' | 'ErrorSeverity';
            event: string;
            tags: Record<string, string | number | boolean>;
            _lid: number;
          }
        ]
      >;
    };
  };
}
