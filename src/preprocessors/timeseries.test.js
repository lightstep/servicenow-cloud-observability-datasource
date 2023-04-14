import { setTemplateSrv } from '@grafana/runtime';
import { createSortedTimestamps, createTimestampMap, createFieldName } from './timeseries';

beforeAll(() => {
  // Create a mock template server
  // nb this is used in the createFieldName tests
  setTemplateSrv({
    getVariables() {
      return [];
    },
    replace(target, scopedVars, format) {
      if (target.includes('$service')) {
        return target.replace('$service', JSON.stringify(['web', 'android', 'ios']));
      }
      return target || '';
    },
  });
});

describe('createSortedTimestamps()', () => {
  test('should assemble a complete set of sorted timestamps for all series', () => {
    const series1 = {
      points: [
        [222, 1.1],
        [555, 1.2],
      ],
    };
    const series2 = { points: [[111, 0.9]] };
    const series3 = {
      points: [
        [333, 1.8],
        [666, 0.77],
      ],
    };
    const series4 = { points: [[444, 9.6]] };

    expect(createSortedTimestamps([series1, series2, series3, series4])).toEqual([111, 222, 333, 444, 555, 666]);
  });
});

describe('createTimestampMap()', () => {
  test("should map a timestamp's value to its index", () => {
    const timestamps = [555, 666];
    const timestampMap = createTimestampMap(timestamps);

    expect(timestampMap).toEqual(
      new Map([
        [555, 0],
        [666, 1],
      ])
    );
    expect(timestampMap.get(555)).toBe(0);
    expect(timestampMap.get(666)).toBe(1);
  });
});

describe('createFieldName', () => {
  test.each([
    // NO QUERY NAME DEFINED
    {
      name: 'returns query text when there are undefined group labels without query name',
      format: undefined,
      queryText: 'metric requests | delta',
      groupLabels: undefined,
      options: {},
      expected: 'metric requests | delta',
    },
    {
      name: 'returns query text when there are empty group labels without query name',
      format: undefined,
      queryText: 'metric requests | delta',
      groupLabels: [],
      options: {},
      expected: 'metric requests | delta',
    },
    {
      name: 'returns formatted single label without query name',
      format: undefined,
      queryText: 'metric requests | delta',
      groupLabels: ['customer=Lightstep'],
      options: {},
      expected: '{customer="Lightstep"}',
    },
    {
      name: 'returns query text when there are empty group labels without query name',
      format: undefined,
      queryText: 'metric requests | delta',
      groupLabels: ['customer=Lightstep', 'service=api', 'method=/pay'],
      options: {},
      expected: '{customer="Lightstep", method="/pay", service="api"}',
    },

    // CUSTOM QUERY NAME DEFINED
    {
      name: 'returns query name when defined',
      format: 'custom',
      queryText: 'metric requests | delta',
      groupLabels: undefined,
      options: {},
      expected: 'custom',
    },
    {
      name: 'returns query name when defined with group labels',
      format: 'custom',
      queryText: 'metric requests | delta',
      groupLabels: ['customer=Lightstep', 'service=api', 'method=/pay'],
      options: {},
      expected: 'custom {customer="Lightstep", method="/pay", service="api"}',
    },
    {
      name: 'returns query name when defined with template variables',
      format: '$service requests',
      queryText: 'metric requests | delta | filter service == $service',
      groupLabels: undefined,
      options: {},
      expected: '["web","android","ios"] requests',
    },

    // EDGE CASES
    {
      name: 'handles "=" in group label value',
      format: undefined,
      queryText: 'metric requests | delta',
      groupLabels: ['compare=true==true'],
      options: {},
      expected: '{compare="true==true"}',
    },
  ])('$name', ({ format, queryText, groupLabels, options, expected }) => {
    expect(createFieldName(format, queryText, groupLabels, options)).toBe(expected);
  });
});
