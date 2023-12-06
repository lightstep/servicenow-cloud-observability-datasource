import { EditorView } from '@codemirror/view';
import { css } from '@emotion/css';
import { Select, Field, Input, Collapse, Badge, getTheme } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import React, { PureComponent, createRef } from 'react';
import invariant from 'tiny-invariant';

import { DataSource } from '../../datasource';
import { LightstepDataSourceOptions, LightstepQuery } from '../../types';
import { createEditorView } from './codemirror';

type Props = QueryEditorProps<DataSource, LightstepQuery, LightstepDataSourceOptions>;
type State = {
  isOptionsOpen: boolean;
};

/**
 * Component responsible for the query text and options editing UI.
 */
export class QueryEditor extends PureComponent<Props, State> {
  containerRef = createRef<HTMLDivElement>();
  editorView: EditorView | null = null;

  state = {
    isOptionsOpen: false,
  };

  componentDidMount(): void {
    const { query, datasource, onChange, onRunQuery } = this.props;
    const projects = datasource.projects();

    // onMount the editor must validate the configured query projectName is part
    // of the configured datasource's configured projects
    // nb: This is a required check for users with multiple instances of the
    // plugin installed, switching between them needs to also update the query
    // project name value
    if (!projects.includes(query.projectName)) {
      onChange({ ...query, projectName: datasource.defaultProjectName() });
      onRunQuery();
    }

    invariant(this.containerRef.current, 'QueryEditor mounted without editor ref');

    this.editorView = createEditorView({
      editorEl: this.containerRef.current,
      initialText: query.text,
      onQueryChange: this.onQueryChange,
      onRunQuery,
    });
  }

  componentWillUnmount(): void {
    this.editorView?.destroy();
  }

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
    const theme = getTheme();

    const projects = this.props.datasource.projects();
    const projectNameOptions = projects.map((project) => ({
      label: project,
      value: project,
    }));

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
          {projects.length > 1 && (
            <Select
              isSearchable={false}
              menuPlacement="bottom"
              options={projectNameOptions}
              value={this.props.query.projectName}
              width={20}
              onChange={this.onProjectSelectionChange}
            />
          )}
          <div
            ref={this.containerRef}
            className={css`
              width: 100%;

              .cm-editor {
                border: 1px solid ${theme.colors.formInputBorder};
                border-radius: ${theme.border.radius.sm};
              }

              .cm-focused {
                outline: 2px solid ${theme.colors.formFocusOutline};
              }

              .cm-content {
                padding: 6px 8px;
                background-color: ${theme.colors.formInputBg};
                // CodeMirror sets caret color to black, unset to support light/dark color modes
                caret-color: unset;
              }

              .cm-gutters {
                background-color: ${theme.colors.panelBg};
                border: 1px solid ${theme.colors.panelBorder};
              }

              .cm-placeholder {
                color: ${theme.colors.formInputPlaceholderText};
              }
            `}
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
