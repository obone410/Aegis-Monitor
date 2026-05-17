# Data Flow

The dashboard is designed around a predictable monitoring snapshot contract.

```mermaid
sequenceDiagram
  participant UI as Dashboard UI
  participant API as /api/monitoring
  participant Service as MonitoringService
  participant Cache as CacheClient
  participant Supabase as Supabase Repository
  participant Vercel as Vercel Adapter
  participant Analytics as Analytics Layer

  UI->>API: GET /api/monitoring
  API->>Service: getSnapshot(traceId, environment)
  Service->>Cache: read short-lived snapshot
  alt cache hit
    Cache-->>Service: cached snapshot
  else cache miss
    Service->>Supabase: service metrics + logs
    Service->>Vercel: deployments
    Service->>Analytics: compute SLOs, incidents, regions, dependencies
    Service->>Cache: store snapshot
  end
  Service-->>API: MonitoringSnapshot
  API-->>UI: { ok, data, meta }
```

## Contract

All monitoring responses use:

```ts
type ApiResponse<T> =
  | { ok: true; data: T; meta: ApiMeta }
  | { ok: false; error: ApiErrorPayload; meta: ApiMeta };
```

The UI can rely on:

- `ok` for success or failure.
- `data` only when `ok` is true.
- `meta.traceId` for log correlation.
- `meta.cache` for cache visibility.
- `meta.role` for RBAC simulation.

## Graceful Degradation

If Supabase or Vercel credentials are missing, the service falls back to demo telemetry. This keeps the production demo shareable while preserving the same response shape a real integration would use.
