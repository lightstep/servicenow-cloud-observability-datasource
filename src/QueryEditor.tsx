import React, { PureComponent } from 'react';
import defaults from 'lodash/defaults';
import {
  BracesPlugin,
  ButtonCascader,
  CascaderOption,
  CompletionItem,
  DOMUtil,
  QueryField,
  SuggestionsState,
  TypeaheadInput,
  TypeaheadOutput,
} from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery } from './types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
interface QueryEditorState {
  labelNameSuggestions: CompletionItem[];
  labelValueSuggestions: {
    [labelName: string]: CompletionItem[];
  };
  metricOptions: CascaderOption[];
  selectedMetricName: string;
  errorMessage: string;
}

// Context values
const metricsContext = 'context-metrics';
const labelsContext = 'context-labels';
const labelValuesContext = 'context-label-values';

export class QueryEditor extends PureComponent<Props, QueryEditorState> {
  plugins: Plugin[] = [BracesPlugin()];
  state: QueryEditorState = {
    errorMessage: '',
    labelNameSuggestions: [],
    labelValueSuggestions: {},
    metricOptions: [],
    selectedMetricName: '',
  };

  componentDidMount() {
    this.props.datasource
      .fetchMetricSuggestions()
      .then((response) => {
        const metrics = response.data['metric-names'];
        const metricOptions = metrics.map((metric) => ({
          label: metric,
          value: metric,
        }));

        this.setState({ metricOptions, errorMessage: '' });
      })
      .catch((error) => {
        console.error(error);
        const errorMessage = error?.data?.errors[0]?.message ?? error.message ?? 'Unexpected Error';
        this.setState({ errorMessage: errorMessage });
      });
  }

  componentWillUnmount() {
    // Refresh chart if query is deleted
    if (this.props.onRunQuery) {
      this.props.onRunQuery();
    }
  }

  refreshLabelSuggestions = (metricName: string): void => {
    // Fetch label suggestions and store them in state
    this.props.datasource
      .fetchMetricLabels(metricName)
      .then((res): void => {
        const labelNameSuggestions: QueryEditorState['labelNameSuggestions'] = [];
        const labelValueSuggestions: QueryEditorState['labelValueSuggestions'] = {};

        res.data['metric-labels'].forEach((label) => {
          const labelKey = label['label-key'];

          labelNameSuggestions.push({ label: labelKey });
          labelValueSuggestions[labelKey] = label['label-values'].map((value): CompletionItem => ({ label: value }));
        });

        this.setState({ labelNameSuggestions, labelValueSuggestions, errorMessage: '' });
      })
      .catch((error) => {
        const errorMessage = error?.data?.errors[0]?.message ?? error.message ?? 'Unexpected Error';
        this.setState({ errorMessage: errorMessage });
      });
  };

  clearSelections = () => {
    this.setState({
      labelNameSuggestions: [],
      labelValueSuggestions: {},
      selectedMetricName: '',
    });
  };

  onQueryChange = (value: string, override?: boolean) => {
    const { onChange, onRunQuery, query } = this.props;

    if (onChange) {
      onChange({ ...query, text: value });

      if (value === '') {
        this.clearSelections();
      }

      if (override && onRunQuery) {
        onRunQuery();
      }
    }
  };

  onSelectMetric = (values: string[]) => {
    const selectedMetricName = values[0];

    this.onQueryChange(selectedMetricName, true);
    this.refreshLabelSuggestions(selectedMetricName);
    this.setState({ selectedMetricName });
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

    // Very basic logic to determine what suggestions to use
    const hasBracket = currentLine.includes('{');
    const hasEqualSign = currentLine.includes('=');

    // Metric names
    if (!hasBracket) {
      return {
        context: metricsContext,
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
        context: labelsContext,
        suggestions: [
          {
            label: 'Labels',
            items: this.state.labelNameSuggestions,
          },
        ],
      };
    }

    // Label values
    const openBracketIndex = currentLine.indexOf('{');
    const equalSignIndex = currentLine.indexOf('=');
    const labelName = currentLine.slice(openBracketIndex + 1, equalSignIndex);

    return {
      context: labelValuesContext,
      suggestions: [
        {
          label: `Label values for "${labelName}"`,
          items: this.state.labelValueSuggestions[labelName],
        },
      ],
    };
  };

  onWillApplySuggestion = (suggestion: string, suggestionsState: SuggestionsState): string => {
    console.log('suggestionsState %o', suggestionsState); // TODO: Remove

    // Modify suggestion based on context
    switch (suggestionsState.typeaheadContext) {
      case metricsContext: {
        this.refreshLabelSuggestions(suggestion);
        this.setState({ selectedMetricName: suggestion });
        break;
      }

      case labelsContext: {
        const nextChar = DOMUtil.getNextCharacter();

        console.log('nextChar %o', nextChar); // TODO: Remove

        if (!nextChar || nextChar === '}' || nextChar === ',') {
          suggestion += '=';
        }

        console.log('suggestion %o', suggestion); // TODO: Remove
        break;
      }

      case labelValuesContext: {
        // Always add quotes and remove existing ones instead
        if (!suggestionsState.typeaheadText.match(/^(!?=~?"|")/)) {
          suggestion = `"${suggestion}`;
        }
        if (DOMUtil.getNextCharacter() !== '"') {
          suggestion = `${suggestion}"`;
        }
        break;
      }

      default:
    }

    return suggestion;
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);

    return (
      <div>
        <div className="gf-form">
          <div className="gf-form flex-shrink-0 min-width-5">
            <ButtonCascader
              value={[this.state.selectedMetricName]}
              options={this.state.metricOptions}
              onChange={this.onSelectMetric}
            >
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
              onBlur={this.props.onRunQuery}
              onChange={this.onQueryChange}
              onRunQuery={this.props.onRunQuery}
              onTypeahead={this.onTypeahead}
              onWillApplySuggestion={this.onWillApplySuggestion}
            />
          </div>
        </div>

        {this.state.errorMessage && (
          // TODO: Firm up error states
          // One possible state to use here is when the selected metric doesn't
          // have any label suggestions.
          <div style={{ color: 'yellow' }}>{this.state.errorMessage}</div>
        )}
      </div>
    );
  }
}
