import React, { PureComponent } from 'react';
import defaults from 'lodash/defaults';
import { BracesPlugin, QueryField, Select, Field, Input, Collapse } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, LightstepDataSourceOptions, LightstepQuery } from './types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
interface QueryEditorState {
  errorMessage: string;
  projects: string[];
  isOptionsOpen: boolean;
}

export class QueryEditor extends PureComponent<Props, QueryEditorState> {
  plugins: Plugin[] = [BracesPlugin()];
  state: QueryEditorState = {
    isOptionsOpen: false,
    errorMessage: '',
    projects: [],
  };

  componentDidMount() {
    this.setState({ projects: this.props.datasource.fetchProjects() });
  }

  componentWillUnmount() {
    // Refresh chart if query is deleted
    if (this.props.onRunQuery) {
      this.props.onRunQuery();
    }
  }

  clearSelections = () => {
    this.setState({
      projects: [],
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

  onChangeFormat = (evt: React.FormEvent<HTMLInputElement>) => {
    const { onChange, onRunQuery, query } = this.props;

    onChange({ ...query, format: evt.currentTarget.value || '' });
    onRunQuery();
  };

  onProjectSelectionChange = ({ value }: SelectableValue) => {
    const { onChange, onRunQuery, query } = this.props;

    // Bail if the projectName value hasn't changed
    if (query.projectName === value) {
      return;
    }

    // Run onChange to update the query with the newly selected value
    onChange({ ...query, projectName: value, text: '' });

    // Run the query to clear chart data
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery(this.props.datasource.defaultProjectName()));
    const projectNameOptions = this.state.projects.map((n) => {
      return {
        label: n,
        value: n,
      };
    });
    return (
      <div>
        <div className="gf-form">
          {this.state.projects.length > 1 && (
            <Select
              options={projectNameOptions}
              value={this.props.query.projectName}
              menuPlacement="bottom"
              onChange={this.onProjectSelectionChange}
              isSearchable={false}
              width={20}
            />
          )}

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
        <div className="gf-form">
          <Collapse
            collapsible
            label="Options"
            isOpen={this.state.isOptionsOpen}
            onToggle={() => this.setState({ isOptionsOpen: !this.state.isOptionsOpen })}
          >
            <Field
              label="Legend"
              description="Series name override or template. Ex. {{hostname}} will be replaced with label value for hostname."
            >
              <Input css name="legendFormat" onChange={this.onChangeFormat} value={this.props.query.format} />
            </Field>
          </Collapse>
        </div>
      </div>
    );
  }
}
