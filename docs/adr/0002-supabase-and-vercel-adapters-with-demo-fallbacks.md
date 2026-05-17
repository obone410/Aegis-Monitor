# ADR-0002: Supabase and Vercel Adapters with Demo Fallbacks

**Date**: 2026-05-17
**Status**: accepted
**Deciders**: Project maintainer, Codex

## Context

The production dashboard should use real cloud integrations, but recruiters and reviewers must still be able to run the project without private credentials. The app also needs a safe public mode that does not expose service-role secrets to the browser.

## Decision

Use Supabase for telemetry seed data, Vercel for deployment history, and demo repositories as graceful fallbacks when credentials or upstream APIs are unavailable.

## Alternatives Considered

### Demo Data Only
- **Pros**: Simple and safe.
- **Cons**: Feels static and less credible as a DevOps project.
- **Why not**: The platform needs to show real integration boundaries.

### Hard Require Cloud Credentials
- **Pros**: Forces production parity.
- **Cons**: Breaks local review and recruiter evaluation.
- **Why not**: A portfolio project must be reviewable from a clean checkout.

## Consequences

### Positive
- Production uses live Supabase and Vercel data.
- Local development remains resilient.
- Repository and service layers clearly model provider boundaries.

### Negative
- Fallback behavior must be documented so reviewers know what is real.

### Risks
- Risk: stale seed data could look misleading.
- Mitigation: SSE and synthetic processors keep the operational surface moving.
