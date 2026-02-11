/**
 * Vector and math utilities for physics calculations.
 */

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function angleBetween(angle1, angle2) {
  let diff = angle2 - angle1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

export function vectorAngle(vx, vy) {
  return Math.atan2(vy, vx);
}

export function vectorMagnitude(vx, vy) {
  return Math.sqrt(vx * vx + vy * vy);
}

export function slopeAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function standardDeviation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Catmull-Rom spline interpolation between 4 points.
 */
export function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

/**
 * Generate smooth spline points from a set of control points.
 */
export function generateSplinePoints(points, resolution) {
  if (points.length < 2) return points;

  const result = [];
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(n - 1, i + 1)];
    const p3 = points[Math.min(n - 1, i + 2)];

    const steps = Math.max(1, Math.round(resolution / (n - 1)));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }

  // Add final point
  result.push({ x: points[n - 1].x, y: points[n - 1].y });
  return result;
}
