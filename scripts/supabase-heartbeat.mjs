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

const now = new Date();
const isoNow = now.toISOString();
const day = isoNow.slice(0, 10);
const pulse = Math.sin((now.getUTCHours() / 24) * Math.PI * 2);
const round = (value, decimals = 2) => Number(value.toFixed(decimals));

const services = [
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
    updated_at: isoNow
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
    updated_at: isoNow
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
    updated_at: isoNow
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
    updated_at: isoNow
  }
];

const logs = [
  {
    id: `heartbeat_${day}`,
    timestamp: isoNow,
    service: "Aegis-Monitor",
    level: "info",
    message: "Scheduled telemetry heartbeat refreshed Supabase monitoring rows",
    request_id: `heartbeat_${day.replaceAll("-", "")}`,
    trace_id: `trace-heartbeat-${day}`
  }
];

async function upsert(table, rows, conflictTarget) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${conflictTarget}`, {
    method: "POST",
    headers,
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    throw new Error(`${table} heartbeat failed: ${response.status} ${await response.text()}`);
  }
}

await upsert("service_metrics", services, "id");
await upsert("deployment_logs", logs, "id");

console.log(`Supabase telemetry heartbeat complete at ${isoNow}.`);
