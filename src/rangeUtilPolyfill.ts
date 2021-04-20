// Polyfill rangeUtil so we can use intervalToSeconds
// This code came from https://github.com/grafana/grafana/blob/57091e3d624ba209d835897fdde0b47e23f1205d/packages/grafana-data/src/datetime/rangeutil.ts

const interval_regex = /(\d+(?:\.\d+)?)(ms|[Mwdhmsy])/;
const intervals_in_seconds = {
  y: 31536000,
  M: 2592000,
  w: 604800,
  d: 86400,
  h: 3600,
  m: 60,
  s: 1,
  ms: 0.001,
};

export function describeInterval(str: string) {
  // Default to seconds if no unit is provided
  if (Number(str)) {
    return {
      sec: intervals_in_seconds.s,
      type: 's',
      count: parseInt(str, 10),
    };
  }

  const matches = str.match(interval_regex);
  if (!matches || !intervals_in_seconds.hasOwnProperty(matches[2])) {
    throw new Error(
      `Invalid interval string, has to be either unit-less or end with one of the following units: "${Object.keys(
        intervals_in_seconds
      ).join(', ')}"`
    );
  }
  return {
    sec: (intervals_in_seconds as any)[matches[2]] as number,
    type: matches[2],
    count: parseInt(matches[1], 10),
  };
}

export function intervalToSeconds(str: string): number {
  const info = describeInterval(str);
  return info.sec * info.count;
}
