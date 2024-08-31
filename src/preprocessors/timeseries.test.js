import { createSortedTimestamps, createTimestampMap, transformLabels } from './timeseries';

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

describe('transformLabels', () => {
  it('single label', () => {
    expect(transformLabels(['customer=Lightstep'])).toEqual({ customer: 'Lightstep' });
  });

  it('missing label value', () => {
    expect(transformLabels(['customer='])).toEqual({ customer: '<undefined>' });
  });

  it('multi labels', () => {
    expect(transformLabels(['customer=LightStep', 'service=web'])).toEqual({ customer: 'LightStep', service: 'web' });
  });

  it('no labels', () => {
    expect(transformLabels([])).toEqual({});
    expect(transformLabels(undefined)).toEqual({});
  });
});
