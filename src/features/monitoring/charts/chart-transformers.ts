import type { ResponsePoint, ThroughputPoint } from "@/types/monitoring";

export type LatencySeriesPoint = ResponsePoint & {
  p95CompositeMs: number;
};

export type ThroughputSeriesPoint = ThroughputPoint & {
  errorRate: number;
};

export function toLatencySeries(points: ResponsePoint[]): LatencySeriesPoint[] {
  return points.map((point) => ({
    ...point,
    p95CompositeMs: Math.max(point.apiMs, point.webMs, point.workerMs)
  }));
}

export function toThroughputSeries(points: ThroughputPoint[]): ThroughputSeriesPoint[] {
  return points.map((point) => ({
    ...point,
    errorRate: point.requests ? Number(((point.errors / point.requests) * 100).toFixed(2)) : 0
  }));
}
