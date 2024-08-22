import { Field, FieldType, MutableDataFrame } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { LightstepQuery, QueryTimeseriesRes } from '../types';

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
 *         "series": [
 *           { "group-labels": ["operation=/get"], "points": [[0,1], [1,7], [2,1]] }
 *           { "group-labels": ["operation=/load"], "points": [[0,6], [1,5], [2,9]] }
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
 *   { name: 'Time', type: FieldType.time, values: [0, 1, 2] },
 *   { name: '{operation="/get"}', type: FieldType.number, values: [1, 7, 1] },
 *   { name: '{operation="/load"}', type: FieldType.number, values: [6, 5, 9] }
 * ]
 * ```
 */
export function preprocessTimeseries(res: QueryTimeseriesRes, query: LightstepQuery, notebookURL: string) {
  const { series } = res.data.attributes;

  // If this is an empty query, bail 👋
  if (!series) {
    return new MutableDataFrame({
      refId: query.refId,
      fields: [],
    });
  }

  // --- Timestamp set: LS API will return only points that have values for each
  // series, which means some series can have different sets of timestamps, so
  // we need to create a complete set of the timestamps for the Time field, and
  // a map for setting each series' point value in the correct index
  const timestamps = createSortedTimestamps(series);
  const timestampToIndexMap = createTimestampMap(timestamps);

  const dataFrameFields: Field[] = [
    { name: 'Time', type: FieldType.time, values: timestamps, config: {} },
  ];

  series.forEach((s) => {
    const values = new Array<number>(timestamps.length);

    // API will currently return undefined for series.points for series without
    // data instead of an empty array
    if (s.points) {
      s.points.forEach(([timestamp, value]) => {
        const timestampIndex = timestampToIndexMap.get(timestamp);

        if (timestampIndex !== undefined) {
          values[timestampIndex] = value;
        }
      });
    }

    dataFrameFields.push({
      name: createFieldName(query.format, query.text, s['group-labels']),
      type: FieldType.number,
      values,
      config: {
        links: [
          {
            url: notebookURL,
            targetBlank: true,
            title: 'Create a Notebook in Lightstep',
          },
        ],
      },
    });
  });

  return new MutableDataFrame({
    refId: query.refId,
    fields: dataFrameFields,
  });
}

// --------------------------------------------------------
// UTILS

/**
 * Produces a formatted display name for a series
 */
export function createFieldName(format: string, queryText: string, groupLabels: string[] = []) {
  let formattedLabels = '';

  if (groupLabels.length > 0) {
    formattedLabels = `{${groupLabels
      .sort((a, b) => a.localeCompare(b))
      // Surround label value in double quotes (e.g. 'key=value' => 'key="value"')
      .map((labelKeyAndValue) => labelKeyAndValue.replace('=', '="') + '"')
      .join(', ')}}`;
  }

  if (format) {
    return getTemplateSrv().replace(format) + (formattedLabels.length > 0 ? ' ' + formattedLabels : '');
  }

  if (groupLabels.length > 0) {
    return formattedLabels;
  }

  return queryText;
}

/**
 * Produces a sorted array of timestamps from every point in every series in the
 * query.
 */
export function createSortedTimestamps(series: QueryTimeseriesRes['data']['attributes']['series']): number[] {
  const timestampSet = new Set<number>();

  series.forEach((s) => {
    // API will currently return undefined for series.points for series without
    // data instead of an empty array
    if (s.points) {
      s.points.forEach(([timestamp]) => timestampSet.add(timestamp));
    }
  });

  return Array.from(timestampSet).sort((a, b) => a - b);
}

/**
 * Produces a map of the timestamp array index for each timestamp value.
 */
export function createTimestampMap(timestamps: number[]): Map<number, number> {
  const timestampToIndexMap = new Map<number, number>();

  for (let i = 0; i < timestamps.length; i++) {
    timestampToIndexMap.set(timestamps[i], i);
  }

  return timestampToIndexMap;
}
