import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildSupabaseHeartbeatPayload,
  sendSupabaseTelemetryHeartbeat
} from "@/server/services/supabase-heartbeat";

describe("supabase telemetry heartbeat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds a bounded daily heartbeat payload", () => {
    const payload = buildSupabaseHeartbeatPayload(new Date("2026-07-22T10:17:00.000Z"));

    expect(payload.day).toBe("2026-07-22");
    expect(payload.services.map((service) => service.id)).toEqual(["api", "web", "workers", "billing"]);
    expect(payload.logs).toHaveLength(1);
    expect(payload.logs[0]).toMatchObject({
      id: "heartbeat_2026-07-22",
      service: "Aegis-Monitor",
      request_id: "heartbeat_20260722",
      trace_id: "trace-heartbeat-2026-07-22"
    });
  });

  it("retries transient Supabase failures before reporting success", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("temporary outage", { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSupabaseTelemetryHeartbeat({
      supabaseUrl: "https://example.supabase.co",
      serviceRoleKey: "service-role-key",
      now: new Date("2026-07-22T10:17:00.000Z"),
      source: "vercel-cron",
      schedule: "17 10 * * *",
      maxAttempts: 2,
      requestTimeoutMs: 1_000
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      day: "2026-07-22",
      source: "vercel-cron",
      schedule: "17 10 * * *",
      logId: "heartbeat_2026-07-22",
      attempts: {
        serviceMetrics: 2,
        deploymentLogs: 1
      }
    });
  });
});
