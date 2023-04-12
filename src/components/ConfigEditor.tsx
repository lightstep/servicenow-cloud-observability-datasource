import React, { ChangeEvent, PureComponent } from 'react';
import { Icon, LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LightstepDataSourceOptions, LightstepSecureJsonData } from '../types';

const { FormField, SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<LightstepDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onOrgNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      orgName: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onProjectNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      projectName: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onAPIHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      apiHost: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        apiKey: event.target.value,
      },
    });
  };

  onResetAPIKey = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData: LightstepSecureJsonData = options.secureJsonData || {};

    const labelWidth = 8;
    const inputWidth = 20;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="Organization Name"
            labelWidth={labelWidth}
            inputWidth={inputWidth}
            onChange={this.onOrgNameChange}
            value={jsonData.orgName || ''}
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Project Name"
            labelWidth={labelWidth}
            inputWidth={inputWidth}
            onChange={this.onProjectNameChange}
            value={jsonData.projectName || ''}
          />
        </div>

        <div className="gf-form">
          <FormField
            label="API Host"
            labelWidth={labelWidth}
            inputWidth={inputWidth}
            onChange={this.onAPIHostChange}
            value={jsonData.apiHost || 'api.lightstep.com'}
          />
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={Boolean(secureJsonFields && secureJsonFields.apiKey)}
              value={secureJsonData.apiKey || ''}
              label="API Key"
              // Use empty string to prevent default 'Password' placeholder
              placeholder=""
              labelWidth={labelWidth}
              inputWidth={inputWidth}
              onReset={this.onResetAPIKey}
              onChange={this.onAPIKeyChange}
              tooltip="API keys are located in Lightstep account settings"
            />
          </div>
        </div>
        <p>
          For more information about API keys,{' '}
          <a
            href="https://docs.lightstep.com/docs/create-and-manage-api-keys"
            target="_blank"
            rel="noreferrer noopener"
          >
            please visit the Lightstep docs <Icon name="external-link-alt" />
          </a>
        </p>
      </div>
    );
  }
}
