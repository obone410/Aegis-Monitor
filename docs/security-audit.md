# Security Audit

**Date**: 2026-05-17  
**Scope**: repository source, local dependency graph, GitHub Actions workflows, API boundaries, and live production endpoints.

## Threat Model

Primary assets:

- Vercel deployment token and project configuration.
- Supabase service-role key and telemetry data.
- Monitoring API response integrity.
- Public portfolio deployment availability.
- GitHub Actions deployment pipeline.

Trust boundaries:

- Browser to Next.js API routes.
- Next.js server runtime to Supabase.
- Next.js server runtime to Vercel REST APIs.
- GitHub Actions to Vercel deployment APIs.
- Local `.env.local` secrets to ignored runtime configuration.

## Finding Discovery

Reviewed:

- API routes in `src/app/api`.
- Server utilities in `src/server`.
- Environment validation in `src/server/env.ts`.
- Supabase and Vercel adapters.
- GitHub Actions workflows.
- Docker and deployment configuration.
- README and docs for accidental secret disclosure.

Automated checks:

- `npm run security:secrets`
- `npm audit --audit-level=moderate`
- `npm audit --omit=dev`
- targeted token-pattern search excluding ignored secret files
- production browser smoke test
- live `/api/health` and `/api/monitoring` checks

## Validation

No committed Vercel, Supabase, OpenAI, or JWT secret values were found in tracked files. Dependency audits returned `0` vulnerabilities. API routes use typed response envelopes, request tracing, rate limiting, API-key guard support, and server-only provider tokens.

Expected secret-name references remain in docs and examples, but values are blank or stored only in ignored `.env.local`, Vercel env vars, and GitHub Actions secrets.

## Attack Path Analysis

No reportable attack path was identified from the repository state reviewed.

Residual risks:

- Tokens pasted during setup should be rotated after final verification.
- RBAC is simulated and should be replaced with SSO before private internal use.
- Operational commands such as rollback are intentionally not exposed yet; adding them would require signed actions and stronger authorization.

## Result

Security audit result: pass for public portfolio deployment, with token rotation recommended as a hygiene follow-up.
