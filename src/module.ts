import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { LightstepQuery, LightstepDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, LightstepQuery, LightstepDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
