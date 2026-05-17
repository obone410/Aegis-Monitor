create table if not exists service_metrics (
  id text primary key,
  name text not null,
  region text not null,
  environment text not null default 'production',
  uptime numeric not null,
  slo_target numeric not null default 99.9,
  p95_latency_ms integer not null,
  error_rate numeric not null,
  requests_per_minute integer not null,
  cpu_load integer not null,
  memory_load integer not null,
  dependencies text[] default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists deployment_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  service text not null,
  level text not null check (level in ('info', 'warn', 'error', 'debug')),
  message text not null,
  request_id text not null,
  trace_id text
);

alter table service_metrics enable row level security;
alter table deployment_logs enable row level security;

drop policy if exists "service metrics are readable" on service_metrics;
create policy "service metrics are readable"
  on service_metrics
  for select
  using (true);

drop policy if exists "deployment logs are readable" on deployment_logs;
create policy "deployment logs are readable"
  on deployment_logs
  for select
  using (true);
