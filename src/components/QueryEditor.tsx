import React, { PureComponent } from 'react';
import defaults from 'lodash/defaults';
import { QueryField, Select, Field, Input, Collapse } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { LightstepDataSourceOptions, LightstepQuery } from '../types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
interface QueryEditorState {
  isOptionsOpen: boolean;
}

export class QueryEditor extends PureComponent<Props, QueryEditorState> {
  state: QueryEditorState = {
    isOptionsOpen: false,
  };

  onQueryChange = (value: string) => {
    const { onChange, query } = this.props;

    onChange({ ...query, text: value });
    // Note query isn't run until user blurs or types shift+enter
  };

  onFormatChange = (evt: React.FormEvent<HTMLInputElement>) => {
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

    onChange({ ...query, projectName: value });
    onRunQuery();
  };

  render() {
    const projects = this.props.datasource.fetchProjects();

    const query = defaults(this.props.query, {
      projectName: this.props.datasource.defaultProjectName(),
      language: 'tql',
    });
    const projectNameOptions = projects.map((project) => {
      return {
        label: project,
        value: project,
      };
    });

    return (
      <div>
        <div className="gf-form">
          {projects.length > 1 && (
            <Select
              options={projectNameOptions}
              value={this.props.query.projectName}
              menuPlacement="bottom"
              onChange={this.onProjectSelectionChange}
              isSearchable={false}
              width={20}
            />
          )}

          <QueryField
            query={query.text}
            portalOrigin="lightstep"
            placeholder="Enter a query (Run with Shift + Enter)"
            onBlur={this.props.onRunQuery}
            onChange={this.onQueryChange}
            onRunQuery={this.props.onRunQuery}
          />
        </div>
        <div className="gf-form">
          <Collapse
            collapsible
            label="Options"
            isOpen={this.state.isOptionsOpen}
            onToggle={() => this.setState({ isOptionsOpen: !this.state.isOptionsOpen })}
          >
            <Field
              label="Query name"
              description="Display name for the query, shown with each series in the chart tooltip and legend"
            >
              <Input
                name="queryName"
                spellCheck="false"
                onChange={this.onFormatChange}
                value={this.props.query.format}
              />
            </Field>
          </Collapse>
        </div>
      </div>
    );
  }
}
