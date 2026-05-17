# Incident Simulation

The incident system is intentionally deterministic enough to test and realistic enough to discuss in interviews.

## Inputs

- service uptime
- p95 latency
- error rate
- CPU load
- memory load
- deployment status
- warning and error logs

## Severity Model

- `sev1`: severe availability, latency, or error-rate breach.
- `sev2`: degraded service that could become customer-impacting.
- `sev3`: low-severity operational follow-up.

## Timeline Model

The timeline merges:

- failed or risky deployments
- warning/error logs
- burn-rate alerts
- incident records

This mirrors how real incident review works: engineers need one ordered view of what changed, what broke, and what mitigation happened.

## Current Simulations

- Queue Workers can trigger elevated latency and burn-rate warnings.
- Billing Webhooks can trigger critical latency/error alerts.
- Failed production deploys are marked as rollback candidates.
- Activity feed events model queue processing, canary promotion, rollback readiness, and alert creation.

## Production Extension

In a real system, this layer would ingest events from:

- OpenTelemetry collector
- deployment webhooks
- log drains
- metrics rollups
- incident management tools such as PagerDuty or Opsgenie
