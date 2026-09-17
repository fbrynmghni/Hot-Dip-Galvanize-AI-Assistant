export interface Range {
  min: number;
  min_incl: boolean;
  max: number | null;
  max_incl?: boolean;
}

export const inRange = (t: number, r: Range) =>
  (r.min_incl ? t >= r.min : t > r.min) &&
  (r.max === null || (r.max_incl ? t <= r.max : t < r.max));

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const round1 = (x: number) => Math.round(x * 10) / 10;
