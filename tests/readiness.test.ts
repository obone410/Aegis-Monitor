import { describe, expect, it } from "vitest";
import {
  evaluateTelemetryFreshness,
  telemetryFreshnessThresholdMs
} from "@/server/readiness";

describe("telemetry readiness", () => {
  const now = Date.parse("2026-07-01T12:00:00.000Z");

  it("accepts telemetry at the freshness boundary", () => {
    const observedAt = new Date(now - telemetryFreshnessThresholdMs).toISOString();

    expect(evaluateTelemetryFreshness(observedAt, now)).toEqual({
      isFresh: true,
      ageMs: telemetryFreshnessThresholdMs
    });
  });

  it("rejects stale telemetry and invalid timestamps", () => {
    const staleAt = new Date(now - telemetryFreshnessThresholdMs - 1).toISOString();

    expect(evaluateTelemetryFreshness(staleAt, now).isFresh).toBe(false);
    expect(evaluateTelemetryFreshness("invalid", now)).toEqual({
      isFresh: false,
      ageMs: null
    });
  });
});
