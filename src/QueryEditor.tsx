import React, { PureComponent } from 'react';
import defaults from 'lodash/defaults';
import {
  BracesPlugin,
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

  /**
   * The return value is what the typeahead filter operates on, and is what's
   * highlighted in the typeahead dropdowns.
   * */
  cleanText = (s: string) => {
    // This is the standard PromQL prefix delimiter regex
    // https://github.com/grafana/grafana/blob/main/public/app/plugins/datasource/prometheus/language_provider.ts#L63
    const partsRegex = /(="|!="|=~"|!~"|\{|\[|\(|\+|-|\/|\*|%|\^|\band\b|\bor\b|\bunless\b|==|>=|!=|<=|>|<|=|~|,)/;
    const parts = s.split(partsRegex);
    const lastPart = parts.pop()!;

    let cleanedText = lastPart.trimLeft().replace(/^"/, '');
    const invalidSuffixRegex = /["})]/;

    // Shave off invalid trailing characters: ", } and )
    while (cleanedText.match(invalidSuffixRegex)) {
      cleanedText = cleanedText.slice(0, -1);
    }

    return cleanedText;
  };

  /**
   * Callback used to generate typeahead suggestions. The items returned from
   * this method are what will populate the typeahead suggestions dropdown.
   * */
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

  /**
   * Fired when a typeahead suggestion is selected. The return value of this
   * method gets placed in the query.
   * */
  onWillApplySuggestion = (suggestion: string, suggestionsState: SuggestionsState): string => {
    // Modify suggestion based on context
    switch (suggestionsState.typeaheadContext) {
      case metricsContext: {
        this.refreshLabelSuggestions(suggestion);
        this.setState({ selectedMetricName: suggestion });
        break;
      }

      case labelsContext: {
        // ⚠️  Heads up, DOMUtil is experimental and could cause errors in the
        // future.
        const nextChar = DOMUtil.getNextCharacter();
        if (!nextChar || nextChar === '}' || nextChar === ',') {
          suggestion += '=';
        }
        break;
      }

      case labelValuesContext: {
        // Always add quotes and remove existing ones instead
        // 📝 NOTE: This regex is rather generous. It's possible we'll want to
        // firm it up in the future.
        if (!suggestionsState.typeaheadText.match(/="/)) {
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
          {this.props.query.language === 'tql' && (
            <QueryField
              query={query.text}
              portalOrigin="lightstep"
              placeholder="Enter a TQL query (Run with Shift + Enter)"
              onBlur={this.props.onRunQuery}
              onChange={this.onQueryChange}
              onRunQuery={this.props.onRunQuery}
            />
          )}
        </div>
      </div>
    );
  }
}
