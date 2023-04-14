import { DataFrame } from '@grafana/data';
import { LightstepQuery, ResponseData } from '../types';
import { preprocessTimeseries } from './timeseries';

/**
 * Preprocessor entry point routes responses to the correct preprocessor
 */
export function preprocessData(res: ResponseData, query: LightstepQuery, notebookURL: string): DataFrame {
  return preprocessTimeseries(res, query, notebookURL);
}
