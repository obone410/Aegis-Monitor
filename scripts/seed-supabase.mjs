const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates"
};

const now = new Date().toISOString();

const services = [
  {
    id: "api",
    name: "Public API",
    region: "iad1",
    environment: "production",
    uptime: 99.96,
    slo_target: 99.9,
    p95_latency_ms: 220,
    error_rate: 0.24,
    requests_per_minute: 1260,
    cpu_load: 52,
    memory_load: 61,
    dependencies: ["web", "workers"],
    updated_at: now
  },
  {
    id: "web",
    name: "Frontend Edge",
    region: "cdg1",
    environment: "production",
    uptime: 99.99,
    slo_target: 99.95,
    p95_latency_ms: 150,
    error_rate: 0.08,
    requests_per_minute: 2140,
    cpu_load: 39,
    memory_load: 43,
    dependencies: ["api"],
    updated_at: now
  },
  {
    id: "workers",
    name: "Queue Workers",
    region: "fra1",
    environment: "production",
    uptime: 99.78,
    slo_target: 99.9,
    p95_latency_ms: 590,
    error_rate: 1.32,
    requests_per_minute: 420,
    cpu_load: 77,
    memory_load: 72,
    dependencies: ["api", "billing"],
    updated_at: now
  },
  {
    id: "billing",
    name: "Billing Webhooks",
    region: "sfo1",
    environment: "production",
    uptime: 99.21,
    slo_target: 99.9,
    p95_latency_ms: 905,
    error_rate: 3.8,
    requests_per_minute: 210,
    cpu_load: 89,
    memory_load: 84,
    dependencies: ["api"],
    updated_at: now
  }
];

const logs = [
  {
    id: "log_9001",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    service: "Billing Webhooks",
    level: "error",
    message: "Stripe signature validation failed after retry",
    request_id: "req_b7f42",
    trace_id: "trace-payments-7f42"
  },
  {
    id: "log_9000",
    timestamp: new Date(Date.now() - 180_000).toISOString(),
    service: "Queue Workers",
    level: "warn",
    message: "Job retry queue crossed soft threshold",
    request_id: "req_19ac0",
    trace_id: "trace-worker-19ac0"
  },
  {
    id: "log_8999",
    timestamp: new Date(Date.now() - 360_000).toISOString(),
    service: "Public API",
    level: "info",
    message: "Canary promotion reached 50 percent traffic",
    request_id: "req_773e1",
    trace_id: "trace-api-773e1"
  }
];

async function upsert(table, rows, conflictTarget) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?on_conflict=${conflictTarget}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(rows)
    }
  );

  if (!response.ok) {
    throw new Error(`${table} seed failed: ${response.status} ${await response.text()}`);
  }
}

await upsert("service_metrics", services, "id");
await upsert("deployment_logs", logs, "id");

console.log("Supabase telemetry seed complete.");
