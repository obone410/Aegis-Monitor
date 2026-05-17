import type { ActivityEvent, LogEvent } from "@/types/monitoring";

export type TelemetryQueueItem =
  | { type: "log"; payload: LogEvent }
  | { type: "activity"; payload: ActivityEvent };

const queue: TelemetryQueueItem[] = [];

export function enqueueTelemetry(item: TelemetryQueueItem) {
  queue.push(item);
  return queue.length;
}

export function drainTelemetry(maxItems = 10) {
  return queue.splice(0, maxItems);
}

export function getQueueDepth() {
  return queue.length;
}
