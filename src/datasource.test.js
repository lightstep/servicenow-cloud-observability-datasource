import { generateFieldName, generateSortedTimestamps, generateTimestampMap } from './datasource.ts';

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

describe('generateFieldName', () => {
  test('should return field name string sorted by label key', () => {
    // Single label
    let groupLabels = ['customer=Lightstep'];
    let expectedFieldName = '{customer="Lightstep"}';

    expect(generateFieldName(groupLabels)).toBe(expectedFieldName);

    // Many labels
    groupLabels = ['customer=LS', 'service=api', 'method=/pay'];
    expectedFieldName = '{customer="LS", method="/pay", service="api"}';

    expect(generateFieldName(groupLabels)).toBe(expectedFieldName);
  });

  test('should return query text', () => {
    const queryText = 'Query text';
    expect(generateFieldName(null, queryText)).toBe(queryText);

    const emptyLabels = [];
    expect(generateFieldName(emptyLabels, queryText)).toBe(queryText);
  });

  // Edge case
  test('should handle "=" in label value', () => {
    const label = 'compare=true==true';
    const expectedName = '{compare="true==true"}';

    expect(generateFieldName([label])).toBe(expectedName);
  });
});
