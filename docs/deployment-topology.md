# Deployment Topology

```mermaid
flowchart TB
  GitHub["GitHub Repository"] --> Actions["GitHub Actions"]
  Actions --> CI["Lint / Typecheck / Tests / Audit / Build"]
  CI --> Preview["Vercel Preview"]
  CI --> Production["Vercel Production"]
  Production --> Next["Next.js App Router"]
  Next --> API["Monitoring API Routes"]
  API --> Supabase["Supabase Telemetry Tables"]
  API --> Vercel["Vercel Deployments API"]
  API --> Cache["Cache Abstraction"]
  API --> SSE["SSE Stream"]
  SSE --> UI["Operations Dashboard"]
```

The topology is intentionally small but production-shaped. GitHub Actions owns verification, Vercel owns runtime delivery, Supabase stores seed telemetry, and the application owns analytics, alert evaluation, and response contracts.

## Environments

- `production`: stable public portfolio deployment.
- `preview`: pull request review deployments.
- `development`: local operator workflow with `.env.local`.

## Isolation

Environment variables are scoped in Vercel for production, preview, and development. Supabase service-role access is server-only. Public anon configuration is safe only for read-only surfaces protected by row-level security.
