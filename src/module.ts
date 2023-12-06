import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor/ConfigEditor';
import { QueryEditor } from './components/QueryEditor/QueryEditor';

export const plugin = new DataSourcePlugin(DataSource).setConfigEditor(ConfigEditor).setQueryEditor(QueryEditor);
