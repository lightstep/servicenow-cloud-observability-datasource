import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, Button } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery, LightstepQueryLanguage } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, text: event.target.value });
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { text } = query;

    return (
      <div className="gf-form">
        <FormField
          inputWidth={30}
          value={text || ''}
          onChange={this.onQueryTextChange}
          label="PromQL Query Text"
          placeholder="Enter a query"
        />
        <Button onClick={this.props.onRunQuery}>Run Query</Button>
      </div>
    );
  }
}
