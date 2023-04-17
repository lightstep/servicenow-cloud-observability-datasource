import { DataFrame } from '@grafana/data';
import { LightstepQuery, QueryRes } from '../types';
import { preprocessTimeseries } from './timeseries';

/**
 * Preprocessor entry point routes responses to the correct preprocessor
 */
export function preprocessData(res: QueryRes, query: LightstepQuery, notebookURL: string): DataFrame {
  return preprocessTimeseries(res, query, notebookURL);
}
