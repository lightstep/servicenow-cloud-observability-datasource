import React, { ChangeEvent, PureComponent } from 'react';
import { Icon, LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LightstepDataSourceOptions, LightstepSecureJsonData } from '../../types';

const { FormField, SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<LightstepDataSourceOptions, LightstepSecureJsonData> {}

/**
 * Component responsible for the plugin configuration form shown when editing
 * the data source.
 */
export class ConfigEditor extends PureComponent<Props> {
  onOrgNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        orgName: event.target.value,
      },
    });
  };

  onProjectNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        projectName: event.target.value,
      },
    });
  };

  onAPIHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        apiHost: event.target.value,
      },
    });
  };

  onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      // Secure fields (only sent to the backend)
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
      // Secure fields (only sent to the backend)
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };

  render() {
    const { jsonData, secureJsonFields, secureJsonData } = this.props.options;

    const labelWidth = 8;
    const inputWidth = 20;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            inputWidth={inputWidth}
            label="Organization Name"
            labelWidth={labelWidth}
            value={jsonData.orgName || ''}
            onChange={this.onOrgNameChange}
          />
        </div>

        <div className="gf-form">
          <FormField
            inputWidth={inputWidth}
            label="Project Name"
            labelWidth={labelWidth}
            value={jsonData.projectName || ''}
            onChange={this.onProjectNameChange}
          />
        </div>

        <div className="gf-form">
          <FormField
            inputWidth={inputWidth}
            label="API Host"
            labelWidth={labelWidth}
            value={jsonData.apiHost || 'api.lightstep.com'}
            onChange={this.onAPIHostChange}
          />
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              inputWidth={inputWidth}
              isConfigured={Boolean(secureJsonFields && secureJsonFields.apiKey)}
              label="API Key"
              labelWidth={labelWidth}
              placeholder="" // Use empty string to prevent default 'Password' placeholder
              tooltip="API keys are located in Lightstep account settings"
              value={secureJsonData?.apiKey || ''}
              onReset={this.onResetAPIKey}
              onChange={this.onAPIKeyChange}
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
