# Rollback Strategy

Rollback is treated as an operational workflow, not a panic button.

## Triggers

- Sev1 incident after deployment.
- Burn rate above acceptable threshold.
- Production deployment status is `error`.
- p95 latency or error rate regresses beyond release guardrails.
- Critical dependency health turns degraded or incident.

## Procedure

1. Confirm the failing deployment in the deployment timeline.
2. Identify the last stable production deployment.
3. Freeze new promotions while the incident is active.
4. Route traffic back to the last stable deployment.
5. Keep monitoring SLO burn, latency, and error rate for at least one full observation window.
6. Open a follow-up item for root cause and prevention.

## Data Needed

- failing commit SHA
- deployment environment
- service owner
- active alerts
- incident severity
- customer impact
- rollback target

## Portfolio Talking Point

The dashboard marks failed production deploys as rollback candidates and connects deployment status to SLO and incident signals. This shows that deployment success is not only "build passed"; it is "the system stayed healthy after release."
