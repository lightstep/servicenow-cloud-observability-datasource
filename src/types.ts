import { DataQuery, DataSourceJsonData } from '@grafana/data';

export type LightstepQueryLanguage = 'tql';
export interface LightstepQuery extends DataQuery {
  text: string;
  language: LightstepQueryLanguage;
}

export const defaultQuery: Partial<LightstepQuery> = {
  language: 'tql',
};

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

// Query Editor types

/**
 * Response from the metric_suggestions endpoint
 * */
export type MetricSuggestionsResponse = {
  data: {
    ['metric-names']: string[];
  };
};

type LabelSuggestion = {
  ['label-key']: string;
  ['label-values']: string[];
};

/**
 * Response from the telemetry_labels endpoint
 * */
export type LabelSuggestionsResponse = {
  data: {
    ['metric-labels']: LabelSuggestion[];
  };
};
