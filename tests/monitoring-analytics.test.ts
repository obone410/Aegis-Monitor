import { describe, expect, it } from "vitest";
import {
  buildSyntheticAlert,
  buildSloSummaries,
  calculateDeploymentRiskProfiles,
  calculateDoraMetrics,
  calculateIncidentSummary,
  calculateProductionReadiness,
  classifyHealth,
  deriveDeploymentStats
} from "../src/lib/monitoring/analytics";
import type { DeploymentEvent, LogEvent, ServiceMetric } from "../src/lib/monitoring/types";

const services: ServiceMetric[] = [
  {
    id: "api",
    name: "Public API",
    region: "iad1",
    uptime: 99.96,
    p95LatencyMs: 228,
    errorRate: 0.24,
    requestsPerMinute: 1280,
    cpuLoad: 54,
    memoryLoad: 62,
    updatedAt: "2026-05-17T08:10:00.000Z"
  },
  {
    id: "workers",
    name: "Queue Workers",
    region: "fra1",
    uptime: 99.78,
    p95LatencyMs: 612,
    errorRate: 1.32,
    requestsPerMinute: 420,
    cpuLoad: 77,
    memoryLoad: 71,
    updatedAt: "2026-05-17T08:10:00.000Z"
  },
  {
    id: "billing",
    name: "Billing Webhooks",
    region: "sfo1",
    uptime: 99.21,
    p95LatencyMs: 910,
    errorRate: 3.8,
    requestsPerMinute: 210,
    cpuLoad: 89,
    memoryLoad: 84,
    updatedAt: "2026-05-17T08:10:00.000Z"
  }
];

const deployments: DeploymentEvent[] = [
  {
    id: "dep_1",
    service: "Public API",
    environment: "production",
    status: "ready",
    commitSha: "a1b2c3d",
    author: "Oyedotun",
    createdAt: "2026-05-17T07:22:00.000Z",
    durationSeconds: 92,
    url: "api.example.com"
  },
  {
    id: "dep_2",
    service: "Queue Workers",
    environment: "preview",
    status: "building",
    commitSha: "b2c3d4e",
    author: "CI Bot",
    createdAt: "2026-05-17T07:34:00.000Z",
    durationSeconds: 146,
    url: "workers-preview.example.com"
  },
  {
    id: "dep_3",
    service: "Billing Webhooks",
    environment: "production",
    status: "error",
    commitSha: "c3d4e5f",
    author: "Oyedotun",
    createdAt: "2026-05-17T08:01:00.000Z",
    durationSeconds: 231,
    url: null
  }
];

const logs: LogEvent[] = [
  {
    id: "log_1",
    timestamp: "2026-05-17T08:09:12.000Z",
    service: "Billing Webhooks",
    level: "error",
    message: "Stripe signature validation failed after retry",
    requestId: "req_1"
  },
  {
    id: "log_2",
    timestamp: "2026-05-17T08:09:32.000Z",
    service: "Queue Workers",
    level: "warn",
    message: "Job retry queue crossed soft threshold",
    requestId: "req_2"
  }
];

describe("monitoring analytics", () => {
  it("classifies service health using availability, latency, error, and saturation thresholds", () => {
    expect(classifyHealth(services[0])).toBe("operational");
    expect(classifyHealth(services[1])).toBe("degraded");
    expect(classifyHealth(services[2])).toBe("incident");
  });

  it("summarizes incidents from services and logs for the dashboard header", () => {
    expect(calculateIncidentSummary(services, logs)).toEqual({
      operationalServices: 1,
      degradedServices: 1,
      incidentServices: 1,
      averageUptime: 99.65,
      averageP95LatencyMs: 583,
      totalRequestsPerMinute: 1910,
      activeAlerts: 2
    });
  });

  it("derives deployment stats that reveal build speed and failure risk", () => {
    expect(deriveDeploymentStats(deployments)).toEqual({
      total: 3,
      ready: 1,
      building: 1,
      failed: 1,
      averageDurationSeconds: 156,
      productionFailureRate: 50
    });
  });

  it("builds a deterministic simulated alert for the riskiest service", () => {
    expect(buildSyntheticAlert(services, "2026-05-17T08:15:00.000Z")).toEqual({
      id: "alert-billing-2026-05-17T08:15:00.000Z",
      service: "Billing Webhooks",
      severity: "critical",
      title: "Billing Webhooks is breaching incident thresholds",
      description: "p95 latency is 910ms, error rate is 3.8%, uptime is 99.21%. Route traffic to the previous stable deployment and inspect recent webhook failures.",
      createdAt: "2026-05-17T08:15:00.000Z",
      runbook: "/runbooks/billing",
      burnRate: 7.9
    });
  });

  it("calculates SLO error budget burn for each service", () => {
    expect(buildSloSummaries(services, "24h")[2]).toEqual({
      service: "Billing Webhooks",
      target: 99.9,
      actual: 99.21,
      errorBudgetRemaining: 0,
      burnRate: 7.9,
      window: "24h",
      status: "degraded"
    });
  });

  it("calculates DORA-style metrics from deployments and resolved incidents", () => {
    expect(
      calculateDoraMetrics(
        deployments,
        [
          {
            id: "inc_1",
            service: "Billing Webhooks",
            severity: "sev2",
            status: "resolved",
            startedAt: "2026-05-17T07:00:00.000Z",
            acknowledgedAt: "2026-05-17T07:08:00.000Z",
            resolvedAt: "2026-05-17T07:42:00.000Z",
            summary: "Webhook retries elevated",
            owner: "Payments Platform"
          }
        ],
        7
      )
    ).toEqual({
      deploymentFrequencyPerDay: 0.43,
      changeFailureRate: 50,
      mttrMinutes: 42,
      leadTimeMinutes: 3
      });
  });

  it("scores deployment risk and production readiness from SRE signals", () => {
    const incidents = [
      {
        id: "inc_1",
        service: "Billing Webhooks",
        severity: "sev1" as const,
        status: "investigating" as const,
        startedAt: "2026-05-17T07:00:00.000Z",
        acknowledgedAt: "2026-05-17T07:08:00.000Z",
        summary: "Webhook retries elevated",
        owner: "Payments Platform"
      }
    ];
    const slos = buildSloSummaries(services, "24h");
    const riskProfiles = calculateDeploymentRiskProfiles(deployments, services, incidents, slos);
    const readiness = calculateProductionReadiness(services, deployments, incidents, slos);

    expect(riskProfiles[2]).toMatchObject({
      service: "Billing Webhooks",
      rollbackRecommended: true,
      correlatedIncidents: 1
    });
    expect(riskProfiles[2].releaseConfidence).toBeLessThan(30);
    expect(readiness.status).toBe("blocked");
    expect(readiness.score).toBeLessThan(65);
  });
});
