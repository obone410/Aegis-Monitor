# Hermes Handover

Last updated: 2026-07-15

This handover is for a follow-on Hermes agent or coding agent that needs to pull up Aegis-Monitor and continue without re-discovering the project from scratch. It is intentionally sanitized: credential values, personal local paths, and private account details are not included.

## Project Snapshot

- Product: Aegis-Monitor
- Purpose: DevOps, SRE, and platform engineering portfolio project that behaves like an internal cloud operations console.
- Repository: `https://github.com/obone410/Aegis-Monitor.git`
- Primary branch: `main`
- Live app: `https://devops-monitoring-dashboard-psi.vercel.app`
- Health endpoint: `https://devops-monitoring-dashboard-psi.vercel.app/api/health`
- Monitoring API: `https://devops-monitoring-dashboard-psi.vercel.app/api/monitoring?cache=bypass`
- Latest known deployed commit during handoff: `aafdab4 feat: harden supabase telemetry heartbeat`

## Current State

The app is production-deployed on Vercel and backed by Supabase telemetry when credentials are present. It also has safe demo fallbacks, so the dashboard remains reviewable if private integrations are unavailable.

Implemented platform features include:

- Next.js App Router dashboard with operational command center UI.
- Typed service and repository layers.
- Supabase telemetry repository and Vercel deployment adapter.
- SLO, SLI, error budget, burn-rate, DORA, incident, deployment-risk, readiness, and release-confidence analytics.
- Server-Sent Events stream for live monitoring snapshots.
- API response envelopes, trace IDs, structured logger, rate limiting, API-key guard support, RBAC simulation, audit logs, and feature flags.
- Readiness healthcheck that validates runtime config and Supabase telemetry freshness.
- CI, security, preview deployment, production deployment, Docker build, and Supabase heartbeat workflows.
- Recruiter-grade README, architecture docs, ADRs, incident simulation docs, scaling docs, rollback docs, and screenshots.

## Pull-Up Sequence

Use this sequence to resume the project from a fresh machine or agent session:

```bash
git clone https://github.com/obone410/Aegis-Monitor.git
cd Aegis-Monitor
npm ci
npm run verify
npm run test:e2e
```

For local Supabase-backed work, create `.env.local` with the variable names listed below. Do not commit `.env.local`.

```bash
node --env-file=.env.local scripts/supabase-heartbeat.mjs
curl https://devops-monitoring-dashboard-psi.vercel.app/api/health
```

If the local build was not already created, run `npm run build` before `npm run test:e2e`. Playwright starts the standalone app through `scripts/start-standalone.mjs`.

## Required Secret Names

Never print or commit actual values. Confirm these are configured in GitHub Actions and Vercel before deployment work:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_API_TOKEN`
- `VERCEL_TEAM_ID`
- `MONITORING_API_KEY` if API-key enforcement is enabled
- `UPSTASH_REDIS_REST_URL` if replacing the in-memory cache abstraction
- `UPSTASH_REDIS_REST_TOKEN` if replacing the in-memory cache abstraction

The Supabase service-role key bypasses RLS. Keep it server-side only and rotate it if it appears in chat, logs, screenshots, issues, or commits.

## Key Files

- `README.md`: portfolio-facing product and architecture overview.
- `src/app/api/monitoring/route.ts`: polling API route.
- `src/app/api/monitoring/stream/route.ts`: SSE live updates.
- `src/app/api/health/route.ts`: readiness endpoint.
- `src/server/readiness.ts`: runtime and Supabase freshness checks.
- `src/server/services/monitoring-service.ts`: application service orchestration.
- `src/server/repositories/telemetry-repository.ts`: Supabase access boundary.
- `src/server/adapters/vercel-deployments.ts`: Vercel integration boundary.
- `src/features/monitoring/analytics/monitoring-analytics.ts`: SLO, DORA, risk, and incident analytics.
- `src/features/monitoring/alerts/alert-evaluator.ts`: alert and burn-rate evaluation.
- `src/features/monitoring/charts/chart-transformers.ts`: chart DTO formatting.
- `src/lib/monitoring/mock-data.ts`: realistic fallback telemetry.
- `scripts/supabase-heartbeat.mjs`: scheduled Supabase activity and telemetry freshness writer.
- `.github/workflows/ci.yml`: lint, typecheck, unit tests, audit, build, Playwright smoke, Docker build.
- `.github/workflows/security.yml`: secret scan, dependency audit, CodeQL.
- `.github/workflows/preview.yml`: Vercel preview deployment.
- `.github/workflows/deployment.yml`: Vercel production deployment.
- `.github/workflows/supabase-heartbeat.yml`: six-hour telemetry heartbeat.
- `docs/supabase-setup.md`: Supabase setup, seeding, readiness, and heartbeat notes.

## Operational Checks

Before making new feature changes, verify the baseline:

```bash
git status --short --branch
npm run verify
npm run test:e2e
npm run security:secrets
npm audit --audit-level=moderate
```

Expected readiness behavior:

- `ok`: runtime config is valid, Supabase is reachable, and telemetry is fresh.
- `ok` with telemetry disabled: app is intentionally using demo data because Supabase is not configured.
- `degraded`: Supabase is configured but unreachable, unauthorized, missing expected tables, or serving telemetry older than the freshness threshold.

The freshness threshold is defined in `src/server/readiness.ts`. At handoff time it is 18 hours.

## Supabase Heartbeat

The project uses `.github/workflows/supabase-heartbeat.yml` to send activity to Supabase every six hours. The heartbeat:

- updates four `service_metrics` rows,
- upserts one bounded daily `deployment_logs` row like `heartbeat_2026-07-15`,
- retries transient timeout, rate-limit, and 5xx failures,
- keeps production readiness green by refreshing telemetry age.

Manual local run:

```bash
node --env-file=.env.local scripts/supabase-heartbeat.mjs
```

Manual GitHub run:

- Open GitHub Actions.
- Select `Supabase Telemetry Heartbeat`.
- Use `Run workflow` on `main`.

Important caveat: periodic GitHub workflow activity is a useful keepalive pattern for free Supabase projects, but only a paid Supabase plan guarantees a project will not pause.

## Deployment Notes

Production deploys are handled by `.github/workflows/deployment.yml` on pushes to `main` and by manual workflow dispatch. The workflow verifies lint, TypeScript, tests, production dependency audit, build, and Playwright smoke tests before running Vercel production deployment.

Preview deployments run for pull requests through `.github/workflows/preview.yml`.

Do not hardcode project IDs or tokens into source. Use GitHub Actions secrets and Vercel environment variables.

## Recommended Next Work

Highest-value continuation items:

1. Add a Vercel Cron fallback for the Supabase heartbeat so GitHub schedule delays are not the only keepalive mechanism.
2. Add an authenticated `/api/cron/supabase-heartbeat` route protected by `CRON_SECRET`.
3. Move shared heartbeat write logic into a server utility so the GitHub script and Vercel Cron route reuse one implementation.
4. Add a small status panel or README badge showing the last successful heartbeat and readiness freshness.
5. Add external uptime monitoring from a provider such as Better Stack, UptimeRobot, or Vercel Observability.
6. Rotate any credentials that were ever pasted into an AI chat or public surface, then update GitHub and Vercel secrets.
7. Execute the dependency roadmap in `docs/major-upgrade-plan.md` when TypeScript 6, ESLint 10, lucide 1.x, or Node type upgrades are safe.

## Change Policy For The Next Agent

- Preserve the production-minded tone and avoid demo-only features.
- Keep secrets out of code, docs, screenshots, logs, and final responses.
- Prefer small, verified changes with `npm run verify`, Playwright smoke tests, and security scanning.
- Keep docs and README accurate after any workflow, endpoint, environment, or deployment change.
- If Supabase credentials are invalid or project reachability fails, do not guess. Ask the operator for fresh credentials and update GitHub/Vercel secrets through secure secret stores only.

## Completion Criteria For Future Work

A continuation is ready to hand back when:

- `npm run verify` passes.
- `npm run test:e2e` passes for dashboard render and SSE behavior.
- `npm run security:secrets` passes.
- Live `/api/health` returns the expected readiness state.
- Relevant GitHub Actions pass after push.
- README and docs reflect any operational changes.
