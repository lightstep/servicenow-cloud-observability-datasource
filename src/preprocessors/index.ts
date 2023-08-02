import { DataFrame } from '@grafana/data';
import { LightstepQuery, QueryLogsRes, QueryRes } from '../types';
import { preprocessLogs } from './logs';
import { preprocessTimeseries } from './timeseries';

/**
 * Preprocessor entry point routes responses to the correct preprocessor
 */
export function preprocessData(res: QueryRes, query: LightstepQuery, notebookURL: string): DataFrame {
  if (isLogsRes(res)) {
    return preprocessLogs(res, query);
  } else {
    return preprocessTimeseries(res, query, notebookURL);
  }
}

function isLogsRes(res: QueryRes): res is QueryLogsRes {
  return 'logs' in res.data.attributes;
}
