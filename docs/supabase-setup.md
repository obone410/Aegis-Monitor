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

- `ok`: runtime is healthy and configured Supabase telemetry is reachable.
- `ok` with `telemetryStore.status = "disabled"`: Supabase is not configured and the app is intentionally using demo telemetry.
- `degraded`: Supabase is configured but unreachable, unauthorized, or missing the expected tables.

If a Supabase project was deleted, paused, or rotated, update Vercel with the new project URL and keys, then run `npm run seed:supabase` locally against the new project.

## Security Note

The service-role key bypasses row-level security and must never be exposed in client code. Rotate it if it is pasted into chat, logs, or a public issue.
