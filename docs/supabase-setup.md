# Supabase Setup

The app can run entirely with demo telemetry, but a live Supabase project makes the dashboard feel more like an internal operations tool.

## 1. Create Tables

Open the Supabase SQL editor and run:

```sql
-- See supabase/schema.sql for the canonical version.
```

Use the full file at `supabase/schema.sql`.

## 2. Seed Demo Telemetry

After `.env.local` contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, run:

```bash
npm run seed:supabase
```

The seed script writes:

- four service metric rows
- realistic production log rows
- dependency metadata for the topology panel

## 3. Deploy Environment Variables

Set these in Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Production and local-development env vars are already supported by the app. Preview env vars should be attached after the GitHub project is linked to Vercel so branch targeting is available.

## 4. Verify Readiness

The healthcheck validates configured telemetry dependencies:

```bash
curl https://your-deployment.example.com/api/health
```

Expected states:

- `ok`: runtime is healthy, Supabase is reachable, and telemetry is less than 18 hours old.
- `ok` with `telemetryStore.status = "disabled"`: Supabase is not configured and the app is intentionally using demo telemetry.
- `degraded`: Supabase is configured but unreachable, unauthorized, missing the expected tables, or serving stale telemetry.

If a Supabase project was deleted, paused, or rotated, update Vercel with the new project URL and keys, then run `npm run seed:supabase` locally against the new project.

## 5. Scheduled Telemetry Heartbeat

The repository includes `.github/workflows/supabase-heartbeat.yml`, which runs every six hours and writes a small operational heartbeat to Supabase. Each run refreshes `service_metrics.updated_at` and upserts a single bounded daily `deployment_logs` row with an id like `heartbeat_2026-06-25`. Transient rate-limit and server failures are retried up to three times.

Required GitHub Actions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Run it manually from GitHub Actions after changing Supabase credentials, or locally with:

```bash
node --env-file=.env.local scripts/supabase-heartbeat.mjs
```

## Security Note

The service-role key bypasses row-level security and must never be exposed in client code. Rotate it if it is pasted into chat, logs, or a public issue.
