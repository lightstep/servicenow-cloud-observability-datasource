import { DataQuery, DataSourceJsonData } from '@grafana/data';

export type LightstepQueryLanguage = 'promql';
export interface LightstepQuery extends DataQuery {
  text: string;
  language: LightstepQueryLanguage;
}

export const defaultQuery: Partial<LightstepQuery> = {
  language: 'promql',
};

/**
 * These are options configured for each DataSource instance
 */
export interface LightstepDataSourceOptions extends DataSourceJsonData {
  orgName: string;
  projectName: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface LightstepSecureJsonData {
  apiKey?: string;
}

export type MetricSuggestionsResponse = {
  data: {
    ['metric-names']: string[];
  };
};
