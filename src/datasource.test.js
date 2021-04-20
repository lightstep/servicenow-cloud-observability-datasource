import { generateSortedTimestamps, generateTimestampMap, transformLabels } from './datasource.ts';

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

describe('transformLabels', () => {
  test('should transform labels from string array to an object', () => {
    const labels = ['key=value', 'key2=value2'];
    const transformedLabels = { key: 'value', key2: 'value2' };

    expect(transformLabels(labels)).toEqual(transformedLabels);

    // Check edges
    expect(transformLabels([])).toEqual({});
    expect(transformLabels()).toEqual({});
  });
});
