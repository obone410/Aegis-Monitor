insert into service_metrics (
  id,
  name,
  region,
  environment,
  uptime,
  slo_target,
  p95_latency_ms,
  error_rate,
  requests_per_minute,
  cpu_load,
  memory_load,
  dependencies,
  updated_at
) values
  ('api', 'Public API', 'iad1', 'production', 99.96, 99.9, 220, 0.24, 1260, 52, 61, array['web', 'workers'], now()),
  ('web', 'Frontend Edge', 'cdg1', 'production', 99.99, 99.95, 150, 0.08, 2140, 39, 43, array['api'], now()),
  ('workers', 'Queue Workers', 'fra1', 'production', 99.78, 99.9, 590, 1.32, 420, 77, 72, array['api', 'billing'], now()),
  ('billing', 'Billing Webhooks', 'sfo1', 'production', 99.21, 99.9, 905, 3.80, 210, 89, 84, array['api'], now())
on conflict (id) do update set
  uptime = excluded.uptime,
  p95_latency_ms = excluded.p95_latency_ms,
  error_rate = excluded.error_rate,
  requests_per_minute = excluded.requests_per_minute,
  cpu_load = excluded.cpu_load,
  memory_load = excluded.memory_load,
  dependencies = excluded.dependencies,
  updated_at = now();

insert into deployment_logs (
  id,
  timestamp,
  service,
  level,
  message,
  request_id,
  trace_id
) values
  ('log_9001', now() - interval '1 minute', 'Billing Webhooks', 'error', 'Stripe signature validation failed after retry', 'req_b7f42', 'trace-payments-7f42'),
  ('log_9000', now() - interval '3 minutes', 'Queue Workers', 'warn', 'Job retry queue crossed soft threshold', 'req_19ac0', 'trace-worker-19ac0'),
  ('log_8999', now() - interval '6 minutes', 'Public API', 'info', 'Canary promotion reached 50 percent traffic', 'req_773e1', 'trace-api-773e1'),
  ('log_8998', now() - interval '11 minutes', 'Frontend Edge', 'info', 'Static asset cache warmed in cdg1', 'req_a65d2', 'trace-edge-a65d2'),
  ('log_8997', now() - interval '16 minutes', 'Queue Workers', 'debug', 'Backpressure controller reduced concurrency to 18', 'req_e219f', 'trace-worker-e219f')
on conflict (id) do update set
  timestamp = excluded.timestamp,
  level = excluded.level,
  message = excluded.message,
  request_id = excluded.request_id,
  trace_id = excluded.trace_id;
