import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, Button, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery, LightstepQueryLanguage } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;

type LanguageOption = {
  label: string;
  value: LightstepQueryLanguage;
  description: string;
};

const options: LanguageOption[] = [
  {
    label: 'TQL',
    value: 'tql',
    description: 'Telemetry Query Language syntax',
  },
  {
    label: 'PromQL',
    value: 'promql',
    description: 'Prometheus query syntax',
  },
];

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, text: event.target.value });
  };

  onSelectionChange = (event: SelectableValue) => {
    const { onChange, onRunQuery, query } = this.props;

    // Run onChange to update the query with the newly selected value
    onChange({ ...query, language: event.value });

    // Run the query to update chart data (this helps with the Change
    // Intelligence click)
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { text } = query;

    return (
      <div className="gf-form">
        <Select
          options={options}
          placeholder="Select language"
          value={this.props.query.language}
          menuPlacement="bottom"
          onChange={this.onSelectionChange}
          width={200}
        />

        <FormField
          inputWidth={30}
          value={text || ''}
          onChange={this.onQueryTextChange}
          label="Query Text"
          placeholder="Enter a query"
        />
        <Button onClick={this.props.onRunQuery}>Run Query</Button>
      </div>
    );
  }
}
