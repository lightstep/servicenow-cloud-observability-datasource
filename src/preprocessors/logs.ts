import { MutableDataFrame, FieldType } from '@grafana/data';
import { LightstepQuery, QueryLogsRes } from 'types';

/**
 * Response pre-processor that converts the LS response data into Grafana wide
 * data frames, eg:
 *
 * **Lightstep API response shape**
 * ```json
 * {
 *   "query": {
 *     "data": {
 *       "attributes": {
 *         "logs": [
 *           [1691409972788, { event: "one", severity: "ErrorSeverity", tags: { ... } }],
 *           [1691409971908, { event: "two", severity: "InfoSeverity", tags: { ... } }]
 *         ]
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * **Grafana DataFrame shape**
 * ```js
 * [
 *   { name: 'time', type: FieldType.time, values: [0, 1, 2] },
 *   { name: 'content', type: FieldType.string, values: ["one", "two"] },
 *   { name: 'level', type: FieldType.string, values: ["error", "info"] }
 * ]
 * ```
 */
export function preprocessLogs(res: QueryLogsRes, query: LightstepQuery) {
  /** Map of "detected fields" aka log tags that have been added to the data frame */
  const detectedFields = new Map<string, boolean>();

  const frame = new MutableDataFrame({
    refId: query.refId,
    meta: {
      preferredVisualisationType: 'logs',
    },
    fields: [
      { name: 'time', type: FieldType.time },
      { name: 'content', type: FieldType.string },
      { name: 'level', type: FieldType.string },
      { name: 'severity', type: FieldType.string },
    ],
  });

  res.data.attributes.logs.forEach(([timestamp, log]) => {
    Object.entries(log.tags).forEach(([key, value]) => {
      // Add every log tag to the set of detected fields once
      if (!detectedFields.has(key)) {
        detectedFields.set(key, true);
        frame.addField({
          name: key,
          type: getFieldTypeForValue(value),
        });
      }
    });

    frame.add({
      time: timestamp,
      content: log.event,
      level: SEVERITY_MAP[log.severity],
      severity: log.severity,
      ...log.tags,
    });
  });

  return frame;
}

/** @ref https://grafana.com/docs/grafana/latest/explore/logs-integration/ */
const SEVERITY_MAP = {
  InfoSeverity: 'info',
  ErrorSeverity: 'error',
  WarningSeverity: 'warning',
};

function getFieldTypeForValue(value: unknown): FieldType {
  switch (typeof value) {
    case 'string':
      return FieldType.string;
    case 'number':
      return FieldType.number;
    case 'boolean':
      return FieldType.boolean;
    default:
      return FieldType.other;
  }
}
