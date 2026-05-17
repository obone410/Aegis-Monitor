# ADR-0003: SSE for Live Operations Updates

**Date**: 2026-05-17
**Status**: accepted
**Deciders**: Project maintainer, Codex

## Context

The dashboard needs live operational updates, but the data flow is server-to-client. Operators are watching telemetry, alerts, and deployment status rather than sending collaborative commands over a bidirectional channel.

## Decision

Use Server-Sent Events for live monitoring updates and keep polling as the fallback behavior.

## Alternatives Considered

### WebSockets
- **Pros**: Bidirectional and flexible.
- **Cons**: More connection state and operational complexity.
- **Why not**: The current use case is one-way telemetry streaming.

### Polling Only
- **Pros**: Simple and reliable.
- **Cons**: Feels less like an operations console and adds delayed visibility.
- **Why not**: Live monitoring is central to the product experience.

## Consequences

### Positive
- Lightweight live updates.
- Works well with typed API snapshots.
- Easy fallback to polling.

### Negative
- Not ideal for future collaborative incident commands.

### Risks
- Risk: long-lived connections may be constrained by hosting limits.
- Mitigation: keep polling fallback and short server-side stream intervals.
