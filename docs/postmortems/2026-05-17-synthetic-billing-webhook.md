# Synthetic Postmortem: Billing Webhook Error Burst

**Date**: 2026-05-17  
**Severity**: SEV1 simulation  
**Status**: resolved in simulation

## Summary

The dashboard simulates an elevated error rate in `Billing Webhooks` after a risky deployment. The incident is designed to exercise SLO burn, deployment correlation, alert prioritization, and rollback decision-making.

## Customer Impact

Webhook retries increased and payment-event processing latency rose above the release-health threshold. In a real environment, this could delay invoice state updates and subscription activation.

## Detection

- Burn-rate alert crossed the critical threshold.
- `Billing Webhooks` p95 latency exceeded the incident limit.
- Deployment risk scoring marked rollback as recommended.

## Timeline

- T+0: Production deployment completes.
- T+6m: Canary promotion event recorded.
- T+8m: Rollback candidate marked.
- T+9m: Burn-rate monitor opens critical alert.
- T+35m: Incident lifecycle begins in the timeline model.

## What Went Well

- Service health, logs, deployments, and SLOs converged into one incident timeline.
- The rollback recommendation used multiple signals instead of build status alone.

## Follow-ups

- Add signed rollback command workflow.
- Persist incident state transitions.
- Add post-deploy synthetic checks for billing endpoints.
