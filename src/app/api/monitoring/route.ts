import type { NextRequest } from "next/server";
import { createApiMeta, fail, ok } from "@/server/api-response";
import { authorizeRequest } from "@/server/auth";
import { recordAudit } from "@/server/audit-log";
import { checkRateLimit } from "@/server/rate-limit";
import { MonitoringService } from "@/server/services/monitoring-service";
import { createTraceId } from "@/server/trace";
import { logger } from "@/server/logger";
import type { EnvironmentName } from "@/types/monitoring";

export const dynamic = "force-dynamic";

const isEnvironmentName = (value: string | null): value is EnvironmentName =>
  value === "production" || value === "preview" || value === "staging";

export async function GET(request: NextRequest) {
  const traceId = request.headers.get("x-request-id") ?? createTraceId("monitoring");
  const auth = authorizeRequest(request);
  const meta = createApiMeta({
    traceId,
    role: auth.role
  });
  const clientId =
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "local";
  const rateLimit = checkRateLimit(`monitoring:${clientId}`, {
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return fail(
      {
        code: "RATE_LIMITED",
        message: "Too many monitoring requests. Retry after the cooldown window."
      },
      meta,
      {
        status: 429,
        headers: {
          "retry-after": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  recordAudit({
    traceId,
    actor: request.headers.get("x-ops-user") ?? "anonymous",
    action: "read",
    resource: "monitoring-snapshot",
    role: auth.role,
    outcome: auth.allowed ? "allowed" : "denied"
  });

  if (!auth.allowed) {
    return fail(
      {
        code: "UNAUTHORIZED",
        message: auth.reason
      },
      meta,
      { status: 401 }
    );
  }

  try {
    const service = MonitoringService.fromEnv();
    const requestedEnvironment = request.nextUrl.searchParams.get("environment");
    const environment = isEnvironmentName(requestedEnvironment) ? requestedEnvironment : "production";
    const { snapshot, cache } = await service.getSnapshot({
      traceId,
      environment,
      bypassCache: request.nextUrl.searchParams.get("cache") === "bypass"
    });

    return ok(snapshot, {
      ...meta,
      cache
    });
  } catch (error) {
    logger.error("monitoring_snapshot_failed", {
      traceId,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return fail(
      {
        code: "SNAPSHOT_FAILED",
        message: "Monitoring snapshot is temporarily unavailable."
      },
      meta,
      { status: 500 }
    );
  }
}
