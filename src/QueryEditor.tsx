import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { ButtonCascader, CascaderOption, QueryField } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery } from './types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  state = { metrics: [] };

  componentDidMount() {
    try {
      this.props.datasource.fetchMetricSuggestions().then((response) => {
        const metrics = response.data['metric-names'];
        const metricOptions = metrics.map((metric) => ({
          label: metric,
          value: metric,
        }));

        this.setState({ metrics: metricOptions });
      });
    } catch (error) {
      console.error(error);
    }
  }

  onQueryChange = (value: string, override?: boolean) => {
    const { onChange, onRunQuery, query } = this.props;

    if (onChange) {
      onChange({ ...query, text: value });

      if (override && onRunQuery) {
        onRunQuery();
      }
    }
  };

  onSelectMetric = (values: string[], selectedOptions: CascaderOption[]) => {
    const { onChange, query } = this.props;
    onChange({ ...query, text: values[0] });
    this.onQueryChange(values[0], true);
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { text } = query;

    return (
      <div className="gf-form">
        <div className="gf-form flex-shrink-0 min-width-5">
          <ButtonCascader options={this.state.metrics} onChange={this.onSelectMetric}>
            {this.state.metrics.length > 0 ? 'Metrics' : '(No metrics found)'}
          </ButtonCascader>
        </div>

        <div className="gf-form gf-form--grow flex-shrink-1 min-width-15">
          <QueryField
            query={text}
            portalOrigin="lightstep"
            placeholder="Enter a PromQL query"
            onChange={this.onQueryChange}
            onRunQuery={this.props.onRunQuery}
            onBlur={this.props.onRunQuery}
          />
        </div>
      </div>
    );
  }
}
