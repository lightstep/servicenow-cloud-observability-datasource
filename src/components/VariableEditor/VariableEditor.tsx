import React, { useCallback, useRef } from 'react';
import { AsyncSelect, InlineField } from '@grafana/ui';
import { DataQuery } from '@grafana/schema';
import { getBackendSrv } from '@grafana/runtime';
import {
  CustomVariableSupport,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  QueryEditorProps,
  SelectableValue,
} from '@grafana/data';
import { Observable } from 'rxjs';
import invariant from 'tiny-invariant';

/**
 * The _Variables_ DataSource is defined separately from the UQL query
 * DataSource because we use a distinct "query" (which is actually just an
 * attributeKey)
 *
 * Calling this out explicitly just in case it results in some type mismatches
 * in the future since the Grafana assumption seems to be that the editor and
 * variables queries will overlap.
 */
type VariableDataSource = DataSourceApi<VariableQuery>;
interface VariableQuery extends DataQuery {
  attributeKey: string;
}

export class VariableEditor extends CustomVariableSupport<VariableDataSource> {
  constructor(readonly url: string, readonly projectName: string) {
    super();
  }

  /**
   * Variable values fetching function that is called for each dashboard
   * variable.
   */
  query = (request: DataQueryRequest<VariableQuery>): Observable<DataQueryResponse> => {
    const { url, projectName } = this;
    const { attributeKey } = request.targets[0];
    invariant(typeof attributeKey === 'string', 'Invalid attribute key');

    return new Observable((subscriber) => {
      getBackendSrv()
        .post(`${url}/projects/${projectName}/telemetry/attributes`, {
          data: {
            'attribute-types': ['values'],
            'telemetry-types': ['spans', 'metrics', 'logs'],
            'scope-to-attribute-keys': [attributeKey],
            'oldest-time': request.range.from,
            'youngest-time': request.range.to,
          },
        })
        .then((res: AttributeRes) => {
          subscriber.next({
            data: res.data[attributeKey].map((v) => ({
              text: v.value,
            })),
          });
        })
        .catch(() => {
          // todo: analytics
          subscriber.next({
            data: [],
          });
        });
    });
  };

  /**
   * Component definition for the UI editor shown to users for creating the
   * query that will be used to fetch variable options.
   *
   * For us, we currently don't have a "query" in the traditional UQL sense,
   * just an attribute key that we will fetch the values for.
   */
  editor = ({ onChange, query }: QueryEditorProps<VariableDataSource, VariableQuery>) => {
    // nb we don't have a way to scope the attribute keys request so we cache
    // the values for performance
    const attributeKeysCache = useRef<null | string[]>(null);

    // options fetching fn called on mount and on each change of the select
    // input
    const loadOptions = useCallback(async (val: string) => {
      if (attributeKeysCache.current === null) {
        const res: AttributeRes = await getBackendSrv().post(
          `${this.url}/projects/${this.projectName}/telemetry/attributes`,
          {
            data: {
              'attribute-types': ['keys'],
              'telemetry-types': ['spans', 'metrics', 'logs'],
            },
          }
        );
        attributeKeysCache.current = Object.keys(res.data);
      }

      const options: Array<SelectableValue<string>> = attributeKeysCache.current
        .filter((key) => key.includes(val))
        .map((key) => ({
          label: key,
          value: key,
        }));

      return options;
    }, []);

    return (
      <div className="gf-form">
        <InlineField
          label="Attribute key"
          tooltip="Cloud Observability uses this key to populate the selectable values for the variable when viewing the dashboard. Choose from any attributes currently on your logs, metics, or traces."
        >
          <AsyncSelect
            defaultOptions
            cacheOptions
            defaultValue={query ? { label: query.attributeKey, value: query.attributeKey } : undefined}
            loadOptions={loadOptions}
            onChange={(v) => {
              if (v.value) {
                onChange({ refId: v.value, attributeKey: v.value });
              }
            }}
          />
        </InlineField>
      </div>
    );
  };
}

/** attributes endpoint response shape */
type AttributeRes = {
  data: Record<
    string,
    Array<{ type: 'string' | 'int64'; value: string; telemetry_type: 'SPANS' | 'METRICS' | 'LOGS' }>
  >;
};
