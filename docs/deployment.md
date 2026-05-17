# Deployment Guide

Production URL: [https://devops-monitoring-dashboard-psi.vercel.app](https://devops-monitoring-dashboard-psi.vercel.app)

Healthcheck URL: [https://devops-monitoring-dashboard-psi.vercel.app/api/health](https://devops-monitoring-dashboard-psi.vercel.app/api/health)

## Local Development

```bash
npm ci
npm run dev
```

## Verification Gates

```bash
npm run lint
npm run typecheck
npm test
npm run audit:prod
npm run build
```

Or:

```bash
make verify
```

## Vercel Deployment

The project includes `vercel.json` with `framework: "nextjs"` so Vercel serves the Next.js build output correctly even if project settings were initially created as `Other`.

Required GitHub secrets for the preview and production workflows:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Optional application secrets:

- `VERCEL_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONITORING_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Vercel Web Analytics is enabled on the project for lightweight production usage visibility.

## Docker

```bash
docker build -t devops-monitoring-dashboard .
docker run --rm -p 3000:3000 devops-monitoring-dashboard
```

The image uses a multi-stage build, runs as a non-root user, and checks `/api/health`.

## Deployment Architecture

```mermaid
flowchart TD
  PR["Pull Request"] --> CI["CI: lint, typecheck, test, audit, build"]
  CI --> Preview["Preview deployment"]
  Preview --> Review["Manual review and observability smoke test"]
  Review --> Main["Merge to main"]
  Main --> ProdCI["Production verification"]
  ProdCI --> Prod["Production deployment"]
  Prod --> Monitor["Post-deploy monitoring"]
  Monitor --> Rollback{"SLO breach?"}
  Rollback -- yes --> Previous["Rollback to previous stable deploy"]
  Rollback -- no --> Observe["Continue observing"]
```
