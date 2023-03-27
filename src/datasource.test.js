import { createFieldName, generateSortedTimestamps, generateTimestampMap, DataSource } from './datasource.ts';
import { setTemplateSrv } from '@grafana/runtime';

describe('generateSortedTimestamps', () => {
  test('should compile and sort all timestamps across all series', () => {
    // 🅐rrange
    // Points are in the form [timestamp, value]
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
    const query = { data: { attributes: { series: [series1, series2, series3, series4] } } };

    // 🅐ct
    const sortedTimestamps = generateSortedTimestamps(query);

    // 🅐ssert
    expect(sortedTimestamps).toEqual([111, 222, 333, 444, 555, 666]);
  });
});

describe('generateTimestampMap', () => {
  test("should map a timestamp's value to its index", () => {
    const timestamps = [555, 666];
    const timestampMap = generateTimestampMap(timestamps);

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

//validate that the Grafana Template Vars are correctly replaced for Lightstep Change Intelligence in the query() func
describe('validateQueryFields', () => {
  // setup a test template server to mimic the real implementation
  const settings = {
    jsonData: {},
    meta: {},
  };
  const ds = new DataSource(settings);
  setTemplateSrv({
    getVariables() {
      return [];
    },
    replace(target, scopedVars, format) {
      if (target === '$sensor') {
        return JSON.stringify(['a', 'b', 'c']);
      }
      return target || '';
    },
  });

  test('should validate the query field matches the value from Grafana template variable', () => {
    const testQuery = [
      {
        text: 'metric requests',
        refId: 'testName',
        language: 'tql',
      },
    ];
    const options = {
      range: {
        from: 0,
        to: 0,
      },
    };
    const expectedResult = {
      tql_query: ['metric requests'],
      title: 'Grafana Chart',
      start_micros: 0,
      end_micros: 0,
      click_millis: '_click_millis_placeholder_',
      source: 'lightstep-metrics-datasource',
    };
    expect(ds.notebookQueryFields(testQuery, options, 'lightstep-metrics-datasource')).toStrictEqual(expectedResult);
  });
});
