# ADR-0001: Layered Next.js Observability Platform

**Date**: 2026-05-17
**Status**: accepted
**Deciders**: Project maintainer, Codex

## Context

The project needs to demonstrate platform engineering maturity without pretending to be a distributed enterprise system. The app must keep UI, API contracts, telemetry access, analytics, and infrastructure concerns separated enough that each can evolve independently.

## Decision

Use a layered Next.js App Router architecture with typed DTOs, server-side services, repository adapters, analytics modules, and reusable dashboard components.

## Alternatives Considered

### Flat Component Dashboard
- **Pros**: Fast to build.
- **Cons**: Business logic ends up inside UI components.
- **Why not**: It does not demonstrate maintainable platform architecture.

### Separate Backend Service
- **Pros**: Strong service boundary.
- **Cons**: Adds deployment and operational overhead for a portfolio project.
- **Why not**: The current scope is best served by server-side Next.js routes and adapters.

## Consequences

### Positive
- Monitoring logic is testable outside React.
- Cloud providers can be swapped through repository adapters.
- API responses are consistent across polling and SSE.

### Negative
- The architecture is more structured than a simple dashboard.

### Risks
- Risk: folder structure can feel ceremonial.
- Mitigation: keep each abstraction tied to a real runtime concern.
