import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { ButtonCascader, CascaderOption, QueryField } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery } from './types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
type QueryEditorState = {
  metricOptions: CascaderOption[];
  selectedMetricName: string;
};

export class QueryEditor extends PureComponent<Props> {
  state: QueryEditorState = { metricOptions: [], selectedMetricName: '' };

  componentDidMount() {
    try {
      this.props.datasource.fetchMetricSuggestions().then((response) => {
        const metrics = response.data['metric-names'];
        const metricOptions = metrics.map((metric) => ({
          label: metric,
          value: metric,
        }));

        this.setState({ metricOptions });
      });
    } catch (error) {
      console.error(error);
    }
  }

  onQueryChange = (value: string, override?: boolean) => {
    const { onChange, onRunQuery, query } = this.props;

    if (onChange) {
      onChange({ ...query, text: value });

      if (value === '') {
        this.setState({ selectedMetricName: '' });
      }

      if (override && onRunQuery) {
        onRunQuery();
      }
    }
  };

  onSelectMetric = (values: string[], selectedOptions: CascaderOption[]) => {
    const { onChange, query } = this.props;
    const selectedMetricName = values[0];

    onChange({ ...query, text: selectedMetricName });

    this.onQueryChange(selectedMetricName, true);
    this.setState({ selectedMetricName });
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);

    return (
      <div className="gf-form">
        <div className="gf-form flex-shrink-0 min-width-5">
          <ButtonCascader options={this.state.metricOptions} onChange={this.onSelectMetric}>
            {this.state.metricOptions.length > 0 ? 'Metrics' : '(No metrics found)'}
          </ButtonCascader>
        </div>

        <div className="gf-form gf-form--grow flex-shrink-1 min-width-15">
          <QueryField
            query={query.text}
            portalOrigin="lightstep"
            placeholder="Enter a PromQL query (Run with Shift + Enter)"
            onChange={this.onQueryChange}
            onRunQuery={this.props.onRunQuery}
            onBlur={this.props.onRunQuery}
          />
        </div>
      </div>
    );
  }
}
