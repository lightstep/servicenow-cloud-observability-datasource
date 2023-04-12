import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface LightstepQuery extends DataQuery {
  projectName: string;
  text: string;
  format: string;
  language: 'tql';
}

/**
 * These are options configured for each DataSource instance
 */
export interface LightstepDataSourceOptions extends DataSourceJsonData {
  orgName: string;
  projectName: string;
  apiHost: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface LightstepSecureJsonData {
  apiKey?: string;
}
