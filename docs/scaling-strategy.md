# Scaling Strategy

## Current Shape

The project runs as a Next.js app with API routes. Demo telemetry keeps the app easy to review, while Supabase and Vercel adapters show how real systems plug in.

## Scaling Paths

### Telemetry Ingestion

- Move raw logs and metrics into a queue-backed ingestion service.
- Batch writes into Supabase or a time-series database.
- Keep summary tables for dashboard reads.

### Caching

- Use the `CacheClient` abstraction with Upstash Redis for shared cache across serverless instances.
- Cache full snapshots for short TTLs.
- Cache slower provider calls, such as deployment history, separately.

### Realtime Updates

- SSE is enough for a dashboard with one-way updates.
- WebSockets become useful when users need acknowledgement, collaboration, or command execution.

### Data Model

- Partition telemetry by service, environment, and time.
- Store rollups for 5m, 1h, 24h, and 7d windows.
- Use retention policies for high-volume logs.

### Security

- Require API keys for non-demo deployments.
- Add role-based access for actions like acknowledging alerts or triggering rollback.
- Keep audit logs for every operational command.

## Future Production Enhancements

- OpenTelemetry collector integration.
- SLO multi-window burn-rate alerting.
- Provider-specific adapters for CloudWatch, Datadog, or Grafana.
- On-call integration for PagerDuty or Slack.
- Read-only public portfolio mode with scrubbed data.
