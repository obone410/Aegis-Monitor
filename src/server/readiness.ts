import { getEnv, getEnvIssues } from "./env";

export type ReadinessCheckStatus = "ok" | "degraded" | "disabled";

export type ReadinessCheck = {
  status: ReadinessCheckStatus;
  detail: string;
  latencyMs?: number;
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

const elapsedSince = (startedAt: number) => Date.now() - startedAt;

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
    const response = await fetch(`${url}/rest/v1/service_metrics?select=id&limit=1`, {
      cache: "no-store",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        status: "degraded",
        detail: `Supabase telemetry returned HTTP ${response.status}.`,
        latencyMs: elapsedSince(startedAt)
      };
    }

    return {
      status: "ok",
      detail: "Supabase service_metrics table is reachable.",
      latencyMs: elapsedSince(startedAt)
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
