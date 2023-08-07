import { MutableDataFrame, FieldType, LogLevel } from '@grafana/data';
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
    let tags = {};
    if ('tags' in log && log.tags !== null && typeof log.tags === 'object') {
      tags = log.tags;
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
    }

    frame.add({
      time: timestamp,
      content: log.event,
      level: getLevel(log),
      severity: log.severity,
      ...tags,
    });
  });

  return frame;
}

// --------------------------------------------------------
// INTERNAL

/** Best effort mapping fn to detect the correct "level" for a log. This
 * determines the color coding of the log line in the panel. */
function getLevel(log: Record<string, unknown>): LogLevel {
  let logLevel: unknown = log.severityNumber ?? log.severityText ?? log.level ?? log.severity ?? 0;

  if (typeof logLevel === 'string') {
    logLevel = logLevel.toLowerCase();
  }

  // --- Grafana natively support levels
  if (String(logLevel) in LogLevel) {
    return LogLevel[logLevel as LogLevel];
  }

  switch (logLevel) {
    // --- OTel SeverityNumber
    case 1:
    case 2:
    case 3:
    case 4:
      return LogLevel.trace;
    case 5:
    case 6:
    case 7:
    case 8:
      return LogLevel.debug;
    case 9:
    case 10:
    case 11:
    case 12:
      return LogLevel.info;
    case 13:
    case 14:
    case 15:
    case 16:
      return LogLevel.warning;
    case 17:
    case 18:
    case 19:
    case 20:
      return LogLevel.error;
    case 21:
    case 22:
    case 23:
    case 24:
      return LogLevel.critical;

    // --- OTel SeverityText
    case 'trace':
      return LogLevel.trace;
    case 'debug':
      return LogLevel.debug;
    case 'info':
      return LogLevel.info;
    case 'warn':
      return LogLevel.warning;
    case 'error':
      return LogLevel.error;
    case 'fatal':
      return LogLevel.critical;

    // --- Misc common levels
    case 'verboseseverity':
      return LogLevel.debug;
    case 'infoseverity':
      return LogLevel.info;
    case 'warningseverity':
      return LogLevel.warning;
    case 'errorseverity':
      return LogLevel.error;
    case 'immediateseverity':
      return LogLevel.critical;
    case 'fatalseverity':
      return LogLevel.critical;
    default:
      return LogLevel.unknown;
  }
}

/** Detects the correct FieldType enum for log fields */
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
