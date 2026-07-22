# Observability Strategy

The dashboard models the signals a platform team would use during and after deployment.

## Signals

- Availability: service uptime and region health.
- Latency: p95 API, web, and worker response time charts.
- Errors: log severity, error rate, and alert counts.
- Saturation: CPU and memory pressure per service.
- Deployments: release status, duration, environment, commit, branch, and rollback candidates.

## SLOs and Error Budget

Each service has an SLO target. The app calculates:

- actual availability
- error budget remaining
- burn rate
- health state based on burn rate

Burn-rate simulation is intentionally simple but realistic enough to explain how SRE teams decide whether to page, slow a rollout, or roll back.

## Incident Management

Incidents are classified from service health:

- `sev1`: severe uptime, latency, or error-rate breach
- `sev2`: degraded service with meaningful customer risk
- `sev3`: low-severity issue or follow-up

The incident timeline merges deploys, logs, alerts, and incident records into one operational view.

## Tracing

Every API response includes a trace ID in both the JSON `meta` payload and `x-trace-id` response header. Logs are emitted as structured JSON so they can be shipped into a log platform later.

## Telemetry Freshness

Supabase-backed telemetry is refreshed automatically by two scheduler paths:

- GitHub Actions runs `npm run heartbeat:supabase` every six hours.
- Vercel Cron invokes `/api/cron/supabase-heartbeat` once per day in production.

Both paths update the same bounded daily heartbeat log row and service metric timestamps, so readiness can detect stale telemetry without growing the log table unnecessarily.
