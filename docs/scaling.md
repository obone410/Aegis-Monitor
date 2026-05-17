# Scaling Strategy

This document summarizes how the portfolio app would scale into an internal startup operations tool.

## Read Path

- Cache complete dashboard snapshots for short TTLs.
- Keep expensive provider calls behind adapters.
- Store rollups for 5m, 1h, 24h, and 7d windows.

## Write Path

- Ingest raw telemetry through a queue.
- Batch writes into Supabase or a time-series store.
- Retain raw logs for a shorter window and rollups for longer reporting.

## Realtime

- SSE is appropriate for one-way dashboard updates.
- WebSockets become useful for interactive acknowledgements, collaborative incident response, or command execution.

## Security

- Keep public portfolio mode on demo telemetry.
- Require API-key or identity-backed auth for private environments.
- Log every operational command into audit logs.
- Separate viewer, responder, and admin roles.

## Infrastructure

- Vercel for the Next.js app and preview deployments.
- Supabase for relational telemetry snapshots.
- Upstash Redis for shared serverless cache.
- GitHub Actions for verification and release gates.
