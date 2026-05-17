# Event Aggregation Pipeline

```mermaid
flowchart LR
  Sources["Deployments / Logs / Metrics"] --> Ingest["Telemetry Ingestion"]
  Ingest --> Queue["Queue Simulation"]
  Queue --> Processor["Telemetry Processor"]
  Processor --> Store["Supabase Tables"]
  Processor --> Cache["Cache Layer"]
  Store --> Analytics["SLO / DORA / Risk Engines"]
  Cache --> API["Monitoring API"]
  Analytics --> API
  API --> Dashboard["Operations Dashboard"]
```

## Processor Responsibilities

- Normalize service, region, and environment labels.
- Attach trace IDs to API responses.
- Calculate SLO burn, incident severity, and deployment confidence.
- Convert provider-specific deployment records into shared DTOs.
- Keep fallback telemetry compatible with production response contracts.

## Scaling Path

The current queue is simulated in-process. A production version would move ingestion to a durable queue, push workers into a separate runtime, and write pre-aggregated telemetry windows for low-latency dashboard reads.
