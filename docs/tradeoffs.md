# Engineering Tradeoffs

## Next.js API Routes Instead of a Separate Backend

This keeps the system deployable as one Vercel project while still allowing server-only adapters, repositories, and services. A separate backend would be justified once ingestion volume, long-running workers, or private operational commands outgrow serverless route handlers.

## Supabase Seed Telemetry Instead of Full Event Storage

Supabase gives the project a real managed database boundary without requiring a large data platform. For production-scale telemetry, raw logs and metrics would move to purpose-built stores while Supabase could keep relational incident, deployment, and configuration records.

## SSE Instead of WebSockets

SSE matches the one-way monitoring flow and keeps the runtime simpler. WebSockets become more valuable if operators can collaborate, acknowledge alerts, or trigger actions inside the console.

## Simulated RBAC Instead of Full Identity

The API models roles and audit events so the architecture is visible, but it avoids adding fake auth complexity. A private internal deployment would connect this layer to SSO and enforce authorization on operational commands.
