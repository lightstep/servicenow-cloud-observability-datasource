import React, { PureComponent } from 'react';
import defaults from 'lodash/defaults';
import { BracesPlugin, ButtonCascader, CascaderOption, QueryField, TypeaheadInput, TypeaheadOutput } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery } from './types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
type QueryEditorState = {
  metricOptions: CascaderOption[];
  selectedMetricName: string;
};

export class QueryEditor extends PureComponent<Props> {
  plugins: Plugin[] = [BracesPlugin()];
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

  onTypeahead = async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
    const emptyResult: TypeaheadOutput = { suggestions: [] };
    const { value } = typeahead;

    if (!value || !this.state.metricOptions) {
      return emptyResult;
    }

    const selectedLines = value.document.getTextsAtRange(value.selection);
    const currentLine = selectedLines.size === 1 ? selectedLines.first().getText() : null;

    if (!currentLine) {
      return emptyResult;
    }

    // TODO: Make this logic more robust
    const hasBracket = currentLine.includes('{');
    const hasEqualSign = currentLine.includes('=');

    // Metric names
    if (!hasBracket) {
      return {
        suggestions: [
          {
            label: 'Metrics',
            items: this.state.metricOptions,
          },
        ],
      };
    }

    // Label Names
    if (!hasEqualSign) {
      return {
        suggestions: [
          {
            label: 'Labels',
            items: [
              // Include '=' when inserting the label name
              { label: 'customer', insertText: 'customer=' },
              { label: 'method', insertText: 'method=' },
            ],
          },
        ],
      };
    }

    // Label values
    const openBracketIndex = currentLine.indexOf('{');
    const equalSignIndex = currentLine.indexOf('=');
    const labelName = currentLine.slice(openBracketIndex + 1, equalSignIndex);

    return {
      suggestions: [
        {
          label: `Label values for "${labelName}"`,
          items: [
            // Include quotes when inserting the label value
            { label: 'prowool', insertText: '"ProWool"' },
          ],
        },
      ],
    };
  };

  cleanText = (s: string) => {
    // This is the standard PromQL prefix delimiter regex
    // https://github.com/grafana/grafana/blob/main/public/app/plugins/datasource/prometheus/language_provider.ts#L63
    const partsRegex = /(="|!="|=~"|!~"|\{|\[|\(|\+|-|\/|\*|%|\^|\band\b|\bor\b|\bunless\b|==|>=|!=|<=|>|<|=|~|,)/;
    const parts = s.split(partsRegex);
    const lastPart = parts.pop()!;
    const cleanedText = lastPart.trimLeft().replace(/"$/, '').replace(/^"/, '');

    return cleanedText;
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
            additionalPlugins={this.plugins}
            cleanText={this.cleanText}
            query={query.text}
            portalOrigin="lightstep"
            placeholder="Enter a PromQL query (Run with Shift + Enter)"
            onChange={this.onQueryChange}
            onRunQuery={this.props.onRunQuery}
            onTypeahead={this.onTypeahead}
            onBlur={this.props.onRunQuery}
          />
        </div>
      </div>
    );
  }
}
