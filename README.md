# Aegis Monitor

[![Production](https://img.shields.io/badge/production-live-16a34a)](https://devops-monitoring-dashboard-psi.vercel.app)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://devops-monitoring-dashboard-psi.vercel.app)
[![Security](https://img.shields.io/badge/security-audited-2563eb)](#security-considerations)

Production-grade deployment monitoring and cloud operations console for a scaling SaaS environment. Aegis Monitor combines deployment intelligence, SLO tracking, incident timelines, live telemetry, and CI/CD visibility into one operator-focused dashboard.

Live: [https://devops-monitoring-dashboard-psi.vercel.app](https://devops-monitoring-dashboard-psi.vercel.app)  
Healthcheck: [https://devops-monitoring-dashboard-psi.vercel.app/api/health](https://devops-monitoring-dashboard-psi.vercel.app/api/health)

## Product Overview

Aegis Monitor is an internal platform engineering console for release health and reliability operations. It tracks service health, Vercel deployments, Supabase-backed telemetry, logs, alerts, SLO burn, DORA metrics, deployment risk, and production readiness.

The production deployment uses Supabase seed telemetry and the Vercel Deployments API, with safe demo fallbacks so the project remains reviewable from a clean checkout.

## Why This Project Exists

Most portfolio dashboards show charts. This project is built to show operational judgment: how releases are verified, how incidents are detected, how SLOs influence deployment decisions, and how cloud systems are structured so teams can operate them safely.

It is designed for DevOps, SRE, platform engineering, and cloud infrastructure interviews where architecture, maintainability, and production awareness matter as much as UI polish.

## Architecture Overview

```mermaid
flowchart LR
  UI["Operations Dashboard"] --> API["/api/monitoring"]
  UI --> SSE["/api/monitoring/stream"]
  API --> Service["MonitoringService"]
  SSE --> Service
  Service --> Cache["Cache Abstraction"]
  Service --> Supabase["Supabase Telemetry Repository"]
  Service --> Vercel["Vercel Deployment Adapter"]
  Service --> Analytics["SLO / DORA / Risk Engines"]
  Analytics --> Contract["Typed API Contract"]
```

Key layers:

- `src/app`: Next.js routes, API handlers, healthcheck, loading, and error boundaries.
- `src/components`: operational dashboard panels and command-center UI.
- `src/features/monitoring`: analytics, alert evaluation, chart transformation, and telemetry processors.
- `src/server`: configuration, env validation, logging, auth, rate limiting, cache, repositories, services, tracing, and API response contracts.
- `src/types`: shared DTOs for frontend, API routes, and tests.

## Infrastructure Design

```mermaid
flowchart TB
  GitHub["GitHub Repository"] --> Actions["GitHub Actions"]
  Actions --> Gates["Lint / Typecheck / Test / Audit / Build"]
  Gates --> Preview["Vercel Preview"]
  Gates --> Production["Vercel Production"]
  Production --> Runtime["Next.js Runtime"]
  Runtime --> Supabase["Supabase"]
  Runtime --> VercelAPI["Vercel Deployments API"]
```

The platform runs as a single Vercel-hosted Next.js application with server-side provider adapters. Supabase stores service metrics and logs. Vercel provides deployment history. GitHub Actions owns verification and deployment automation.

See [Deployment Topology](docs/deployment-topology.md).

## Observability Philosophy

The dashboard treats a successful deployment as more than a green build. A release is healthy only when service SLOs, error budgets, incident state, latency, deployment status, and dependency health stay within guardrails.

Implemented observability concepts:

- Service Level Objectives and Service Level Indicators.
- Error budget remaining and burn-rate alerting.
- MTTR, change failure rate, deployment frequency, and lead time.
- Region health and dependency graph monitoring.
- Deployment risk scoring and release confidence.
- Incident lifecycle timeline and synthetic postmortem flow.

See [Observability Strategy](docs/observability.md).

## CI/CD Pipeline

Workflows:

- `.github/workflows/ci.yml`: lint, typecheck, unit tests, production dependency audit, build, Docker build.
- `.github/workflows/security.yml`: secret-pattern scan, full dependency audit, CodeQL.
- `.github/workflows/preview.yml`: pull request preview deployments.
- `.github/workflows/deployment.yml`: production deployment through Vercel.

The current GitHub Actions production deployment has passed with Vercel secrets configured.

## Monitoring Strategy

The monitoring API returns one structured snapshot used by both polling and SSE streaming. The service layer merges:

- Supabase service metrics and deployment logs.
- Vercel deployment records.
- Derived SLO, DORA, readiness, incident, and deployment-risk analytics.
- Demo fallback telemetry when cloud credentials are unavailable.

Realtime behavior is implemented through Server-Sent Events with polling fallback.

## Incident Response Flow

```mermaid
sequenceDiagram
  participant Deploy as Deployment
  participant Telemetry as Telemetry Processor
  participant Alert as Alert Evaluator
  participant Incident as Incident Timeline
  participant Operator as Operator
  Deploy->>Telemetry: new release event
  Telemetry->>Alert: latency, error, SLO burn signals
  Alert->>Incident: severity and timeline entry
  Incident->>Operator: readiness and rollback recommendation
```

Incident views include severity, owner, status, timeline context, related logs, deployment correlation, and rollback intelligence.

## Scalability Strategy

The current app is intentionally compact, but the boundaries are production-shaped:

- Move telemetry ingestion to a durable queue.
- Store high-cardinality logs in a purpose-built log store.
- Keep Supabase for relational incident, deployment, and configuration records.
- Precompute 24h, 7d, and 30d analytics windows.
- Replace memory cache with Redis or Upstash REST.
- Enforce tenant-aware authorization before multi-team use.

See [Scaling Strategy](docs/scaling.md) and [Telemetry Retention](docs/telemetry-retention.md).

## Security Considerations

Implemented:

- Zod environment validation.
- Server-only service-role usage.
- API response envelopes and request trace IDs.
- Rate limiting, API-key guard path, RBAC simulation, and audit logs.
- Dependency audit and CodeQL workflows.
- Local committed-secret scanner.

Remaining before private internal use:

- Rotate any token used during setup.
- Replace simulated RBAC with SSO-backed authorization.
- Add signed operational actions for rollback and alert acknowledgement.
- Enable branch protection and managed secret scanning in GitHub.

See [Security Notes](docs/security.md).

Latest local audit summary: [Security Audit](docs/security-audit.md).

## Local Development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Optional cloud configuration lives in `.env.local`. Start from `.env.example` and keep secrets out of Git.

## Production Deployment

Production is deployed on Vercel:

[https://devops-monitoring-dashboard-psi.vercel.app](https://devops-monitoring-dashboard-psi.vercel.app)

Required GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required runtime integrations for full production behavior:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_API_TOKEN`
- `VERCEL_TEAM_ID`
- `VERCEL_PROJECT_ID`

## Screenshots

Desktop command center:

![Desktop dashboard](public/screenshots/dashboard-desktop.png)

Mobile operations layout:

![Mobile dashboard](public/screenshots/dashboard-mobile.png)

## Architecture Diagrams

- [Architecture](docs/architecture.md)
- [Data Flow](docs/data-flow.md)
- [Deployment Topology](docs/deployment-topology.md)
- [Event Aggregation Pipeline](docs/event-aggregation-pipeline.md)

## Engineering Tradeoffs

The project favors believable production patterns over fake enterprise complexity. Important decisions are recorded in:

- [ADRs](docs/adr/README.md)
- [Engineering Tradeoffs](docs/tradeoffs.md)
- [Rollback Strategy](docs/rollback-strategy.md)
- [Synthetic Postmortem](docs/postmortems/2026-05-17-synthetic-billing-webhook.md)

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run security:audit
npm run audit:prod
npm run build
```

Or run the full local gate:

```bash
npm run verify
```

## Future Enhancements

- Persist incident lifecycle state transitions.
- Add authenticated alert acknowledgement and rollback commands.
- Add synthetic probes from multiple regions.
- Add tenant-scoped projects and service ownership.
- Add long-term analytics retention and monthly SLO reports.
- Add OpenTelemetry export compatibility.
