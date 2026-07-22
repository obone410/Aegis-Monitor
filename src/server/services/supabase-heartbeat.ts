type HeartbeatSource = "github-actions" | "vercel-cron" | "manual";

type SupabaseServiceMetricRow = {
  id: string;
  name: string;
  region: string;
  environment: "production";
  uptime: number;
  slo_target: number;
  p95_latency_ms: number;
  error_rate: number;
  requests_per_minute: number;
  cpu_load: number;
  memory_load: number;
  dependencies: string[];
  updated_at: string;
};

type SupabaseDeploymentLogRow = {
  id: string;
  timestamp: string;
  service: string;
  level: "info";
  message: string;
  request_id: string;
  trace_id: string;
};

type SupabaseHeartbeatOptions = {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  now?: Date;
  source?: HeartbeatSource;
  schedule?: string;
  maxAttempts?: number;
  requestTimeoutMs?: number;
};

type SupabaseHeartbeatPayload = {
  day: string;
  writtenAt: string;
  services: SupabaseServiceMetricRow[];
  logs: SupabaseDeploymentLogRow[];
};

export type SupabaseHeartbeatResult = {
  day: string;
  writtenAt: string;
  source: HeartbeatSource;
  schedule: string | null;
  serviceMetricIds: string[];
  logId: string;
  attempts: {
    serviceMetrics: number;
    deploymentLogs: number;
  };
};

const defaultMaxAttempts = 3;
const defaultRequestTimeoutMs = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

function normalizeSupabaseUrl(supabaseUrl: string) {
  return supabaseUrl.replace(/\/+$/, "");
}

function isTransientStatus(status: number) {
  return status === 429 || status >= 500;
}

export function buildSupabaseHeartbeatPayload(now = new Date()): SupabaseHeartbeatPayload {
  const writtenAt = now.toISOString();
  const day = writtenAt.slice(0, 10);
  const pulse = Math.sin((now.getUTCHours() / 24) * Math.PI * 2);

  return {
    day,
    writtenAt,
    services: [
      {
        id: "api",
        name: "Public API",
        region: "iad1",
        environment: "production",
        uptime: round(99.94 + pulse * 0.02),
        slo_target: 99.9,
        p95_latency_ms: Math.round(220 + pulse * 18),
        error_rate: round(0.24 + Math.max(0, pulse) * 0.06),
        requests_per_minute: Math.round(1260 + pulse * 90),
        cpu_load: Math.round(52 + pulse * 6),
        memory_load: Math.round(61 + pulse * 4),
        dependencies: ["web", "workers"],
        updated_at: writtenAt
      },
      {
        id: "web",
        name: "Frontend Edge",
        region: "cdg1",
        environment: "production",
        uptime: round(99.98 + pulse * 0.01),
        slo_target: 99.95,
        p95_latency_ms: Math.round(150 + pulse * 11),
        error_rate: round(0.08 + Math.max(0, pulse) * 0.03),
        requests_per_minute: Math.round(2140 + pulse * 130),
        cpu_load: Math.round(39 + pulse * 4),
        memory_load: Math.round(43 + pulse * 5),
        dependencies: ["api"],
        updated_at: writtenAt
      },
      {
        id: "workers",
        name: "Queue Workers",
        region: "fra1",
        environment: "production",
        uptime: round(99.76 + pulse * 0.03),
        slo_target: 99.9,
        p95_latency_ms: Math.round(590 + pulse * 30),
        error_rate: round(1.32 + Math.max(0, pulse) * 0.12),
        requests_per_minute: Math.round(420 + pulse * 22),
        cpu_load: Math.round(77 + pulse * 5),
        memory_load: Math.round(72 + pulse * 4),
        dependencies: ["api", "billing"],
        updated_at: writtenAt
      },
      {
        id: "billing",
        name: "Billing Webhooks",
        region: "sfo1",
        environment: "production",
        uptime: round(99.2 + pulse * 0.04),
        slo_target: 99.9,
        p95_latency_ms: Math.round(905 + pulse * 26),
        error_rate: round(3.8 + Math.max(0, pulse) * 0.2),
        requests_per_minute: Math.round(210 + pulse * 14),
        cpu_load: Math.round(89 + pulse * 3),
        memory_load: Math.round(84 + pulse * 4),
        dependencies: ["api"],
        updated_at: writtenAt
      }
    ],
    logs: [
      {
        id: `heartbeat_${day}`,
        timestamp: writtenAt,
        service: "Aegis-Monitor",
        level: "info",
        message: "Scheduled telemetry heartbeat refreshed Supabase monitoring rows",
        request_id: `heartbeat_${day.replaceAll("-", "")}`,
        trace_id: `trace-heartbeat-${day}`
      }
    ]
  };
}

async function upsertRows(
  table: string,
  rows: SupabaseServiceMetricRow[] | SupabaseDeploymentLogRow[],
  conflictTarget: string,
  options: Required<Pick<SupabaseHeartbeatOptions, "maxAttempts" | "requestTimeoutMs">> & {
    supabaseUrl: string;
    serviceRoleKey: string;
  }
) {
  const headers = {
    apikey: options.serviceRoleKey,
    Authorization: `Bearer ${options.serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates"
  };

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(
        `${normalizeSupabaseUrl(options.supabaseUrl)}/rest/v1/${table}?on_conflict=${conflictTarget}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(rows),
          signal: AbortSignal.timeout(options.requestTimeoutMs)
        }
      );
    } catch (error) {
      if (attempt === options.maxAttempts) {
        throw error;
      }

      await sleep(500 * 2 ** (attempt - 1));
      continue;
    }

    if (response.ok) {
      return attempt;
    }

    const responseBody = await response.text();

    if (!isTransientStatus(response.status) || attempt === options.maxAttempts) {
      throw new Error(`${table} heartbeat failed: ${response.status} ${responseBody}`);
    }

    await sleep(500 * 2 ** (attempt - 1));
  }

  throw new Error(`${table} heartbeat failed after ${options.maxAttempts} attempts.`);
}

export async function sendSupabaseTelemetryHeartbeat(
  options: SupabaseHeartbeatOptions = {}
): Promise<SupabaseHeartbeatResult> {
  const supabaseUrl = options.supabaseUrl;
  const serviceRoleKey = options.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const payload = buildSupabaseHeartbeatPayload(options.now);
  const requestOptions = {
    supabaseUrl,
    serviceRoleKey,
    maxAttempts: options.maxAttempts ?? defaultMaxAttempts,
    requestTimeoutMs: options.requestTimeoutMs ?? defaultRequestTimeoutMs
  };

  const serviceMetricAttempts = await upsertRows(
    "service_metrics",
    payload.services,
    "id",
    requestOptions
  );
  const deploymentLogAttempts = await upsertRows("deployment_logs", payload.logs, "id", requestOptions);

  return {
    day: payload.day,
    writtenAt: payload.writtenAt,
    source: options.source ?? "manual",
    schedule: options.schedule ?? null,
    serviceMetricIds: payload.services.map((service) => service.id),
    logId: payload.logs[0].id,
    attempts: {
      serviceMetrics: serviceMetricAttempts,
      deploymentLogs: deploymentLogAttempts
    }
  };
}
