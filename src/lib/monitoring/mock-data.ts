import {
  buildDependencyGraph,
  buildIncidentTimeline,
  buildIncidents,
  buildRegionHealth,
  buildSloSummaries,
  buildSyntheticAlert,
  calculateDeploymentRiskProfiles,
  calculateDoraMetrics,
  calculateProductionReadiness,
  detectAnomalies
} from "@/features/monitoring/analytics/monitoring-analytics";
import type {
  DeploymentEvent,
  LogEvent,
  MonitoringSnapshot,
  ResponsePoint,
  ServiceMetric,
  ThroughputPoint
} from "./types";

const isoMinutesAgo = (now: Date, minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

const timeLabel = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

export function buildServiceMetrics(now = new Date()): ServiceMetric[] {
  const pulse = Math.sin((now.getMinutes() / 60) * Math.PI * 2);

  return [
    {
      id: "api",
      name: "Public API",
      region: "iad1",
      environment: "production",
      uptime: 99.96,
      sloTarget: 99.9,
      p95LatencyMs: Math.round(220 + pulse * 18),
      errorRate: 0.24,
      requestsPerMinute: Math.round(1260 + pulse * 90),
      cpuLoad: Math.round(52 + pulse * 6),
      memoryLoad: 61,
      dependencies: ["web", "workers"],
      updatedAt: now.toISOString()
    },
    {
      id: "web",
      name: "Frontend Edge",
      region: "cdg1",
      environment: "production",
      uptime: 99.99,
      sloTarget: 99.95,
      p95LatencyMs: Math.round(150 + pulse * 11),
      errorRate: 0.08,
      requestsPerMinute: Math.round(2140 + pulse * 130),
      cpuLoad: 39,
      memoryLoad: Math.round(43 + pulse * 5),
      dependencies: ["api"],
      updatedAt: now.toISOString()
    },
    {
      id: "workers",
      name: "Queue Workers",
      region: "fra1",
      environment: "production",
      uptime: 99.78,
      sloTarget: 99.9,
      p95LatencyMs: Math.round(590 + pulse * 30),
      errorRate: 1.32,
      requestsPerMinute: Math.round(420 + pulse * 22),
      cpuLoad: 77,
      memoryLoad: 72,
      dependencies: ["api", "billing"],
      updatedAt: now.toISOString()
    },
    {
      id: "billing",
      name: "Billing Webhooks",
      region: "sfo1",
      environment: "production",
      uptime: 99.21,
      sloTarget: 99.9,
      p95LatencyMs: Math.round(905 + pulse * 26),
      errorRate: 3.8,
      requestsPerMinute: Math.round(210 + pulse * 14),
      cpuLoad: 89,
      memoryLoad: 84,
      dependencies: ["api"],
      updatedAt: now.toISOString()
    }
  ];
}

export function buildDeployments(now = new Date()): DeploymentEvent[] {
  return [
    {
      id: "dep_api_3029",
      service: "Public API",
      environment: "production",
      status: "ready",
      commitSha: "a1b2c3d",
      branch: "main",
      author: "Oyedotun",
      createdAt: isoMinutesAgo(now, 38),
      durationSeconds: 92,
      url: "api-observability.vercel.app"
    },
    {
      id: "dep_edge_1275",
      service: "Frontend Edge",
      environment: "production",
      status: "ready",
      commitSha: "f9e8d7c",
      branch: "main",
      author: "CI Bot",
      createdAt: isoMinutesAgo(now, 54),
      durationSeconds: 71,
      url: "devops-dashboard.vercel.app"
    },
    {
      id: "dep_workers_8812",
      service: "Queue Workers",
      environment: "preview",
      status: "building",
      commitSha: "b2c3d4e",
      branch: "feature/queue-backpressure",
      author: "CI Bot",
      createdAt: isoMinutesAgo(now, 17),
      durationSeconds: 146,
      url: "workers-preview.vercel.app"
    },
    {
      id: "dep_billing_7341",
      service: "Billing Webhooks",
      environment: "production",
      status: "error",
      commitSha: "c3d4e5f",
      branch: "main",
      author: "Oyedotun",
      createdAt: isoMinutesAgo(now, 9),
      durationSeconds: 231,
      url: null,
      rollbackCandidate: true
    }
  ];
}

export function buildLogs(now = new Date()): LogEvent[] {
  return [
    {
      id: "log_9001",
      timestamp: isoMinutesAgo(now, 1),
      service: "Billing Webhooks",
      level: "error",
      message: "Stripe signature validation failed after retry",
      requestId: "req_b7f42",
      traceId: "trace-payments-7f42"
    },
    {
      id: "log_9000",
      timestamp: isoMinutesAgo(now, 3),
      service: "Queue Workers",
      level: "warn",
      message: "Job retry queue crossed soft threshold",
      requestId: "req_19ac0",
      traceId: "trace-worker-19ac0"
    },
    {
      id: "log_8999",
      timestamp: isoMinutesAgo(now, 6),
      service: "Public API",
      level: "info",
      message: "Canary promotion reached 50 percent traffic",
      requestId: "req_773e1",
      traceId: "trace-api-773e1"
    },
    {
      id: "log_8998",
      timestamp: isoMinutesAgo(now, 11),
      service: "Frontend Edge",
      level: "info",
      message: "Static asset cache warmed in cdg1",
      requestId: "req_a65d2",
      traceId: "trace-edge-a65d2"
    },
    {
      id: "log_8997",
      timestamp: isoMinutesAgo(now, 16),
      service: "Queue Workers",
      level: "debug",
      message: "Backpressure controller reduced concurrency to 18",
      requestId: "req_e219f",
      traceId: "trace-worker-e219f"
    }
  ];
}

export function buildResponseTimes(now = new Date()): ResponsePoint[] {
  return Array.from({ length: 10 }, (_, index) => {
    const minutesAgo = (9 - index) * 5;
    const date = new Date(now.getTime() - minutesAgo * 60_000);
    const wave = Math.sin(index * 0.9 + now.getMinutes() / 10);

    return {
      time: timeLabel(date),
      apiMs: Math.round(215 + wave * 24 + index * 3),
      webMs: Math.round(128 + wave * 13),
      workerMs: Math.round(410 + wave * 46 + index * 18),
      errors: Math.max(0, Math.round(3 + wave * 2 + (index > 6 ? index - 5 : 0)))
    };
  });
}

export function buildThroughput(now = new Date()): ThroughputPoint[] {
  return Array.from({ length: 8 }, (_, index) => {
    const minutesAgo = (7 - index) * 10;
    const date = new Date(now.getTime() - minutesAgo * 60_000);
    const wave = Math.cos(index * 0.7 + now.getMinutes() / 12);

    return {
      time: timeLabel(date),
      requests: Math.round(3200 + wave * 420 + index * 85),
      errors: Math.max(3, Math.round(22 + wave * 8 + index * 3)),
      deploys: index === 2 || index === 6 ? 1 : 0
    };
  });
}

export function buildDemoSnapshot(now = new Date()): MonitoringSnapshot {
  const services = buildServiceMetrics(now);
  const deployments = buildDeployments(now);
  const logs = buildLogs(now);
  const responseTimes = buildResponseTimes(now);
  const throughput = buildThroughput(now);
  const alerts = [buildSyntheticAlert(services, now.toISOString())];
  const incidents = buildIncidents(services, now);
  const slos = buildSloSummaries(services, "24h");
  const deploymentRisks = calculateDeploymentRiskProfiles(deployments, services, incidents, slos);

  return {
    traceId: `trace-demo-${now.getTime()}`,
    generatedAt: now.toISOString(),
    environment: "production",
    services,
    deployments,
    logs,
    responseTimes,
    throughput,
    alerts,
    incidents,
    incidentTimeline: buildIncidentTimeline(logs, deployments, alerts, incidents),
    slos,
    doraMetrics: calculateDoraMetrics(deployments, incidents),
    regionHealth: buildRegionHealth(services),
    dependencyGraph: buildDependencyGraph(services),
    anomalies: detectAnomalies(responseTimes, now.toISOString()),
    deploymentRisks,
    productionReadiness: calculateProductionReadiness(services, deployments, incidents, slos),
    activity: [
      {
        id: "act-canary",
        timestamp: isoMinutesAgo(now, 6),
        actor: "release-bot",
        action: "promoted canary",
        target: "Public API",
        severity: "info"
      },
      {
        id: "act-rollback-ready",
        timestamp: isoMinutesAgo(now, 8),
        actor: "ops-console",
        action: "marked rollback candidate",
        target: "Billing Webhooks",
        severity: "warning"
      },
      {
        id: "act-alert",
        timestamp: isoMinutesAgo(now, 9),
        actor: "burn-rate-monitor",
        action: "opened alert",
        target: "Billing Webhooks",
        severity: "critical"
      }
    ],
    featureFlags: {
      sseLiveUpdates: true,
      apiKeyProtection: false,
      rbacSimulation: true,
      redisCache: false,
      telemetryQueue: true
    },
    dataSources: ["Demo telemetry stream"]
  };
}
