import React, { PureComponent } from 'react';
import defaults from 'lodash/defaults';
import { QueryField, Field, Input, Collapse, Badge } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { LightstepDataSourceOptions, LightstepQuery } from '../types';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
type State = {
  isOptionsOpen: boolean;
};

/**
 * Component responsible for the query text and options editing UI.
 */
export class QueryEditor extends PureComponent<Props, State> {
  state = {
    isOptionsOpen: false,
  };

  onQueryChange = (value: string) => {
    const { onChange, query } = this.props;

    onChange({ ...query, text: value });
    // nb: query isn't run until user blurs or types shift+enter
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
    const query = defaults(this.props.query, {
      projectName: this.props.datasource.projectName,
      language: 'tql',
    });

    return (
      <div>
        <div className="gf-form">
          <Badge
            color="blue"
            icon="external-link-alt"
            text={
              <a href="https://docs.lightstep.com/docs/uql-cheatsheet" target="_blank" rel="noreferrer">
                UQL Reference
              </a>
            }
            style={{ marginLeft: 'auto' }}
          />
        </div>
        <div className="gf-form">
          <QueryField
            portalOrigin="lightstep"
            placeholder="Enter a query (Run with Shift + Enter)"
            query={query.text}
            onBlur={this.props.onRunQuery}
            onChange={this.onQueryChange}
            onRunQuery={this.props.onRunQuery}
          />
        </div>
        <div className="gf-form">
          <Collapse
            collapsible
            isOpen={this.state.isOptionsOpen}
            label="Options"
            onToggle={() => this.setState({ isOptionsOpen: !this.state.isOptionsOpen })}
          >
            <Field
              label="Query name"
              description="Display name for the query, shown with each series in the chart tooltip and legend"
            >
              <Input
                name="queryName"
                spellCheck="false"
                value={this.props.query.format}
                onChange={this.onFormatChange}
              />
            </Field>
          </Collapse>
        </div>
      </div>
    );
  }
}
