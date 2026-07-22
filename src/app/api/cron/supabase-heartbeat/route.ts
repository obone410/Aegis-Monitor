import type { NextRequest } from "next/server";
import { createApiMeta, fail, ok } from "@/server/api-response";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { sendSupabaseTelemetryHeartbeat } from "@/server/services/supabase-heartbeat";
import { createTraceId } from "@/server/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const traceId = request.headers.get("x-request-id") ?? createTraceId("cron-heartbeat");
  const meta = createApiMeta({
    traceId,
    role: "admin"
  });
  const env = getEnv();
  const cronSecret = env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    logger.warn("supabase_heartbeat_cron_secret_missing", { traceId });

    return fail(
      {
        code: "CRON_SECRET_REQUIRED",
        message: "Cron heartbeat is not configured. Set CRON_SECRET in Vercel."
      },
      meta,
      { status: 503 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("supabase_heartbeat_cron_unauthorized", { traceId });

    return fail(
      {
        code: "UNAUTHORIZED",
        message: "Cron heartbeat request is unauthorized."
      },
      meta,
      { status: 401 }
    );
  }

  try {
    const result = await sendSupabaseTelemetryHeartbeat({
      supabaseUrl: env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      source: "vercel-cron",
      schedule: request.headers.get("x-vercel-cron-schedule") ?? undefined
    });

    logger.info("supabase_heartbeat_cron_complete", {
      traceId,
      writtenAt: result.writtenAt,
      logId: result.logId
    });

    return ok(result, meta, {
      headers: {
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    logger.error("supabase_heartbeat_cron_failed", {
      traceId,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return fail(
      {
        code: "HEARTBEAT_FAILED",
        message: "Supabase telemetry heartbeat failed."
      },
      meta,
      { status: 500 }
    );
  }
}
