# Telemetry Retention Strategy

This portfolio uses compact seed telemetry, but the architecture assumes a tiered retention model for a real SaaS operations platform.

| Data | Hot Retention | Cold Retention | Notes |
|------|---------------|----------------|-------|
| Service metrics | 7 days | 13 months | Downsample from minute to hour aggregates. |
| Deployment events | 90 days | 24 months | Keep commit, branch, author, status, and rollback markers. |
| Incident timeline | 13 months | 36 months | Required for quarterly reliability reviews. |
| API logs | 7 days | 30 days | Redact secrets and personal data before storage. |
| SLO summaries | 13 months | 36 months | Preserve monthly error-budget reviews. |

## Aggregation

High-cardinality logs should be sampled and aggregated before they reach dashboard queries. Operator-facing views should read precomputed windows for `24h`, `7d`, and `30d` rather than scanning raw events on every request.
