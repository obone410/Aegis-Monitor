import { getEnv, getEnvIssues } from "./env";

export type ReadinessCheckStatus = "ok" | "degraded" | "disabled";

export type ReadinessCheck = {
  status: ReadinessCheckStatus;
  detail: string;
  latencyMs?: number;
  observedAt?: string;
  ageMs?: number;
};

export type ReadinessReport = {
  status: "ok" | "degraded";
  checkedAt: string;
  checks: {
    app: ReadinessCheck;
    environment: ReadinessCheck;
    telemetryStore: ReadinessCheck;
  };
  envIssues: Array<{
    path: string;
    message: string;
  }>;
};

const readinessTimeoutMs = 2500;
export const telemetryFreshnessThresholdMs = 18 * 60 * 60 * 1000;

const elapsedSince = (startedAt: number) => Date.now() - startedAt;

export function evaluateTelemetryFreshness(updatedAt: string, nowMs = Date.now()) {
  const updatedAtMs = Date.parse(updatedAt);

  if (!Number.isFinite(updatedAtMs)) {
    return {
      isFresh: false,
      ageMs: null
    };
  }

  const ageMs = Math.max(0, nowMs - updatedAtMs);

  return {
    isFresh: ageMs <= telemetryFreshnessThresholdMs,
    ageMs
  };
}

async function checkSupabaseReadiness(): Promise<ReadinessCheck> {
  const env = getEnv();
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      status: "disabled",
      detail: "Supabase telemetry is not configured; dashboard will use demo telemetry."
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), readinessTimeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(
      `${url}/rest/v1/service_metrics?select=id,updated_at&order=updated_at.desc&limit=1`,
      {
        cache: "no-store",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        signal: controller.signal
      }
    );

    if (!response.ok) {
      return {
        status: "degraded",
        detail: `Supabase telemetry returned HTTP ${response.status}.`,
        latencyMs: elapsedSince(startedAt)
      };
    }

    const rows: unknown = await response.json();
    const latest = Array.isArray(rows) ? rows[0] : null;
    const updatedAt =
      latest && typeof latest === "object" && "updated_at" in latest
        ? String(latest.updated_at)
        : "";
    const freshness = evaluateTelemetryFreshness(updatedAt);

    if (!freshness.isFresh || freshness.ageMs === null) {
      const ageDetail =
        freshness.ageMs === null
          ? "has no valid updated_at value"
          : `is ${Math.floor(freshness.ageMs / (60 * 60 * 1000))}h old`;

      return {
        status: "degraded",
        detail: `Latest Supabase telemetry ${ageDetail}.`,
        latencyMs: elapsedSince(startedAt),
        observedAt: updatedAt || undefined,
        ageMs: freshness.ageMs ?? undefined
      };
    }

    return {
      status: "ok",
      detail: "Supabase service_metrics table is reachable and telemetry is fresh.",
      latencyMs: elapsedSince(startedAt),
      observedAt: updatedAt,
      ageMs: freshness.ageMs
    };
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";

    return {
      status: "degraded",
      detail: isAbort ? "Supabase telemetry timed out." : "Supabase telemetry is unreachable.",
      latencyMs: elapsedSince(startedAt)
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getReadinessReport(): Promise<ReadinessReport> {
  const issues = getEnvIssues();
  const envIssues = issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
  const environment: ReadinessCheck = envIssues.length
    ? {
        status: "degraded",
        detail: `${envIssues.length} environment validation issue(s) detected.`
      }
    : {
        status: "ok",
        detail: "Environment contract is valid."
      };
  const telemetryStore =
    environment.status === "ok"
      ? await checkSupabaseReadiness()
      : {
          status: "degraded" as const,
          detail: "Environment validation failed before dependency checks could run."
        };
  const status = environment.status === "ok" && telemetryStore.status !== "degraded" ? "ok" : "degraded";

  return {
    status,
    checkedAt: new Date().toISOString(),
    checks: {
      app: {
        status: "ok",
        detail: "Next.js runtime is responding."
      },
      environment,
      telemetryStore
    },
    envIssues
  };
}
