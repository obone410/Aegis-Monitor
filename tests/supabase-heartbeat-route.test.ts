import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { sendHeartbeat } = vi.hoisted(() => ({
  sendHeartbeat: vi.fn()
}));

vi.mock("@/server/services/supabase-heartbeat", () => ({
  sendSupabaseTelemetryHeartbeat: sendHeartbeat
}));

const originalEnv = { ...process.env };
const cronSecret = "local-cron-secret-for-verification";

async function getRoute() {
  return import("@/app/api/cron/supabase-heartbeat/route");
}

describe("Supabase heartbeat cron route", () => {
  beforeEach(() => {
    vi.resetModules();
    sendHeartbeat.mockReset();
    process.env = {
      ...originalEnv,
      CRON_SECRET: cronSecret,
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects requests without the cron secret", async () => {
    const { GET } = await getRoute();
    const response = await GET(new NextRequest("https://example.com/api/cron/supabase-heartbeat"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHORIZED"
      }
    });
    expect(sendHeartbeat).not.toHaveBeenCalled();
  });

  it("runs the heartbeat when Vercel supplies the configured secret", async () => {
    sendHeartbeat.mockResolvedValue({
      day: "2026-07-22",
      writtenAt: "2026-07-22T10:17:00.000Z",
      source: "vercel-cron",
      schedule: "17 10 * * *",
      serviceMetricIds: ["api", "web", "workers", "billing"],
      logId: "heartbeat_2026-07-22",
      attempts: {
        serviceMetrics: 1,
        deploymentLogs: 1
      }
    });

    const { GET } = await getRoute();
    const response = await GET(
      new NextRequest("https://example.com/api/cron/supabase-heartbeat", {
        headers: {
          authorization: `Bearer ${cronSecret}`,
          "x-vercel-cron-schedule": "17 10 * * *"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        source: "vercel-cron",
        logId: "heartbeat_2026-07-22"
      }
    });
    expect(sendHeartbeat).toHaveBeenCalledWith({
      supabaseUrl: "https://example.supabase.co",
      serviceRoleKey: "service-role-key",
      source: "vercel-cron",
      schedule: "17 10 * * *"
    });
  });
});
