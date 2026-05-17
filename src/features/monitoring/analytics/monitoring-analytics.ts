import type {
  AlertEvent,
  AnomalyEvent,
  DeploymentEvent,
  DeploymentStats,
  DependencyGraph,
  DoraMetrics,
  HealthStatus,
  IncidentEvent,
  IncidentSummary,
  IncidentTimelineItem,
  LogEvent,
  RegionHealth,
  ResponsePoint,
  ServiceMetric,
  SloSummary,
  TimeWindow
} from "@/types/monitoring";

const roundTo = (value: number, places = 0) => {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
};

export function classifyHealth(metric: ServiceMetric): HealthStatus {
  if (
    metric.uptime < 99.5 ||
    metric.p95LatencyMs > 750 ||
    metric.errorRate >= 2.5 ||
    metric.cpuLoad >= 88 ||
    metric.memoryLoad >= 88
  ) {
    return "incident";
  }

  if (
    metric.uptime < 99.9 ||
    metric.p95LatencyMs > 450 ||
    metric.errorRate >= 1 ||
    metric.cpuLoad >= 75 ||
    metric.memoryLoad >= 75
  ) {
    return "degraded";
  }

  return "operational";
}

export function calculateIncidentSummary(
  services: ServiceMetric[],
  logs: LogEvent[]
): IncidentSummary {
  const healthCounts = services.reduce(
    (counts, service) => {
      const status = classifyHealth(service);
      counts[status] += 1;
      return counts;
    },
    { operational: 0, degraded: 0, incident: 0 }
  );

  const serviceCount = services.length || 1;
  const averageUptime = services.reduce((total, service) => total + service.uptime, 0) / serviceCount;
  const averageP95LatencyMs =
    services.reduce((total, service) => total + service.p95LatencyMs, 0) / serviceCount;
  const totalRequestsPerMinute = services.reduce(
    (total, service) => total + service.requestsPerMinute,
    0
  );
  const activeAlerts = logs.filter((log) => log.level === "warn" || log.level === "error").length;

  return {
    operationalServices: healthCounts.operational,
    degradedServices: healthCounts.degraded,
    incidentServices: healthCounts.incident,
    averageUptime: roundTo(averageUptime, 2),
    averageP95LatencyMs: Math.round(averageP95LatencyMs),
    totalRequestsPerMinute,
    activeAlerts
  };
}

export function deriveDeploymentStats(deployments: DeploymentEvent[]): DeploymentStats {
  const total = deployments.length;
  const ready = deployments.filter((deployment) => deployment.status === "ready").length;
  const building = deployments.filter((deployment) => deployment.status === "building").length;
  const failed = deployments.filter((deployment) => deployment.status === "error").length;
  const averageDurationSeconds = total
    ? Math.round(
        deployments.reduce((duration, deployment) => duration + deployment.durationSeconds, 0) /
          total
      )
    : 0;

  const productionDeployments = deployments.filter(
    (deployment) => deployment.environment === "production"
  );
  const productionFailures = productionDeployments.filter(
    (deployment) => deployment.status === "error"
  ).length;
  const productionFailureRate = productionDeployments.length
    ? Math.round((productionFailures / productionDeployments.length) * 100)
    : 0;

  return {
    total,
    ready,
    building,
    failed,
    averageDurationSeconds,
    productionFailureRate
  };
}

function riskScore(service: ServiceMetric) {
  const health = classifyHealth(service);
  const healthWeight = health === "incident" ? 100 : health === "degraded" ? 50 : 0;
  return healthWeight + service.errorRate * 12 + service.p95LatencyMs / 20 + (100 - service.uptime) * 8;
}

export function buildSyntheticAlert(
  services: ServiceMetric[],
  createdAt = new Date().toISOString()
): AlertEvent {
  const riskiest = [...services].sort((left, right) => riskScore(right) - riskScore(left))[0];
  const status = classifyHealth(riskiest);
  const severity = status === "incident" ? "critical" : status === "degraded" ? "warning" : "info";
  const burnRate = calculateBurnRate(riskiest);
  const action =
    severity === "critical"
      ? "Route traffic to the previous stable deployment and inspect recent webhook failures."
      : severity === "warning"
        ? "Watch the next release and compare latency against the previous deployment."
        : "Keep monitoring release health and error budget burn.";

  return {
    id: `alert-${riskiest.id}-${createdAt}`,
    service: riskiest.name,
    severity,
    title: `${riskiest.name} is ${
      severity === "critical" ? "breaching incident thresholds" : "approaching SLO limits"
    }`,
    description: `p95 latency is ${riskiest.p95LatencyMs}ms, error rate is ${riskiest.errorRate}%, uptime is ${riskiest.uptime}%. ${action}`,
    createdAt,
    runbook: `/runbooks/${riskiest.id}`,
    burnRate
  };
}

export function percentile(values: number[], percentileRank: number) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentileRank / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function calculateBurnRate(service: ServiceMetric) {
  const target = service.sloTarget ?? 99.9;
  const allowedFailure = Math.max(0.001, 100 - target);
  const actualFailure = Math.max(0, 100 - service.uptime);
  return roundTo(actualFailure / allowedFailure, 2);
}

export function buildSloSummaries(
  services: ServiceMetric[],
  window: TimeWindow = "24h"
): SloSummary[] {
  return services.map((service) => {
    const target = service.sloTarget ?? 99.9;
    const consumed = Math.max(0, 100 - service.uptime);
    const budget = Math.max(0.001, 100 - target);
    const remaining = Math.max(0, 100 - (consumed / budget) * 100);
    const burnRate = calculateBurnRate(service);

    return {
      service: service.name,
      target,
      actual: service.uptime,
      errorBudgetRemaining: roundTo(remaining, 1),
      burnRate,
      window,
      status: burnRate >= 8 ? "incident" : burnRate >= 2 ? "degraded" : "operational"
    };
  });
}

export function classifyIncidentSeverity(service: ServiceMetric): IncidentEvent["severity"] {
  if (service.errorRate >= 3 || service.uptime < 99.3 || service.p95LatencyMs > 900) {
    return "sev1";
  }

  if (service.errorRate >= 1 || service.uptime < 99.9 || service.p95LatencyMs > 450) {
    return "sev2";
  }

  return "sev3";
}

export function buildIncidents(
  services: ServiceMetric[],
  now = new Date()
): IncidentEvent[] {
  return services
    .filter((service) => classifyHealth(service) !== "operational")
    .map((service, index) => {
      const startedAt = new Date(now.getTime() - (35 + index * 18) * 60_000);
      const acknowledgedAt = new Date(startedAt.getTime() + 8 * 60_000);
      const resolvedAt =
        classifyHealth(service) === "degraded"
          ? new Date(acknowledgedAt.getTime() + 22 * 60_000)
          : undefined;

      return {
        id: `inc-${service.id}-${startedAt.toISOString()}`,
        service: service.name,
        severity: classifyIncidentSeverity(service),
        status: resolvedAt ? "resolved" : "investigating",
        startedAt: startedAt.toISOString(),
        acknowledgedAt: acknowledgedAt.toISOString(),
        resolvedAt: resolvedAt?.toISOString(),
        summary: `${service.name} breached release-health thresholds in ${service.region}.`,
        owner: service.id === "billing" ? "Payments Platform" : "Cloud Operations"
      };
    });
}

export function calculateDoraMetrics(
  deployments: DeploymentEvent[],
  incidents: IncidentEvent[],
  days = 7
): DoraMetrics {
  const deploymentFrequencyPerDay = roundTo(deployments.length / days, 2);
  const productionDeployments = deployments.filter(
    (deployment) => deployment.environment === "production"
  );
  const failedProduction = productionDeployments.filter(
    (deployment) => deployment.status === "error"
  ).length;
  const resolvedIncidents = incidents.filter(
    (incident) => incident.acknowledgedAt && incident.resolvedAt
  );
  const mttrMinutes = resolvedIncidents.length
    ? Math.round(
        resolvedIncidents.reduce((total, incident) => {
          const started = new Date(incident.startedAt).getTime();
          const resolved = new Date(incident.resolvedAt as string).getTime();
          return total + (resolved - started) / 60_000;
        }, 0) / resolvedIncidents.length
      )
    : 0;
  const leadTimeMinutes = deployments.length
    ? Math.round(
        deployments.reduce((total, deployment) => total + deployment.durationSeconds / 60, 0) /
          deployments.length
      )
    : 0;

  return {
    deploymentFrequencyPerDay,
    changeFailureRate: productionDeployments.length
      ? Math.round((failedProduction / productionDeployments.length) * 100)
      : 0,
    mttrMinutes,
    leadTimeMinutes
  };
}

export function buildIncidentTimeline(
  logs: LogEvent[],
  deployments: DeploymentEvent[],
  alerts: AlertEvent[],
  incidents: IncidentEvent[]
): IncidentTimelineItem[] {
  const logItems: IncidentTimelineItem[] = logs
    .filter((log) => log.level === "warn" || log.level === "error")
    .map((log) => ({
      id: `timeline-${log.id}`,
      timestamp: log.timestamp,
      title: `${log.level.toUpperCase()} in ${log.service}`,
      description: log.message,
      type: "log",
      severity: log.level === "error" ? "critical" : "warning"
    }));

  const deployItems: IncidentTimelineItem[] = deployments.map((deployment) => ({
    id: `timeline-${deployment.id}`,
    timestamp: deployment.createdAt,
    title: `${deployment.service} deployed to ${deployment.environment}`,
    description: `${deployment.commitSha} by ${deployment.author} finished as ${deployment.status}.`,
    type: "deploy",
    severity: deployment.status === "error" ? "critical" : "info"
  }));

  const alertItems: IncidentTimelineItem[] = alerts.map((alert) => ({
    id: `timeline-${alert.id}`,
    timestamp: alert.createdAt,
    title: alert.title,
    description: alert.description,
    type: "alert",
    severity: alert.severity
  }));

  const incidentItems: IncidentTimelineItem[] = incidents.map((incident) => ({
    id: `timeline-${incident.id}`,
    timestamp: incident.startedAt,
    title: `${incident.severity.toUpperCase()} ${incident.service}`,
    description: incident.summary,
    type: "incident",
    severity: incident.severity === "sev1" ? "critical" : "warning"
  }));

  return [...logItems, ...deployItems, ...alertItems, ...incidentItems]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 12);
}

export function buildRegionHealth(services: ServiceMetric[]): RegionHealth[] {
  const grouped = services.reduce<Record<string, ServiceMetric[]>>((groups, service) => {
    groups[service.region] = [...(groups[service.region] ?? []), service];
    return groups;
  }, {});

  return Object.entries(grouped).map(([region, regionServices]) => {
    const averageLatencyMs = Math.round(
      regionServices.reduce((total, service) => total + service.p95LatencyMs, 0) /
        regionServices.length
    );
    const averageUptime = roundTo(
      regionServices.reduce((total, service) => total + service.uptime, 0) /
        regionServices.length,
      2
    );
    const statuses = regionServices.map(classifyHealth);
    const status = statuses.includes("incident")
      ? "incident"
      : statuses.includes("degraded")
        ? "degraded"
        : "operational";

    return {
      region,
      services: regionServices.length,
      status,
      averageLatencyMs,
      averageUptime
    };
  });
}

export function buildDependencyGraph(services: ServiceMetric[]): DependencyGraph {
  const nodes = services.map((service) => ({
    id: service.id,
    name: service.name,
    status: classifyHealth(service)
  }));
  const edges = services.flatMap((service) =>
    (service.dependencies ?? []).map((dependency) => ({
      from: service.id,
      to: dependency,
      status: classifyHealth(service)
    }))
  );

  return {
    nodes,
    edges
  };
}

export function detectAnomalies(
  responseTimes: ResponsePoint[],
  createdAt = new Date().toISOString()
): AnomalyEvent[] {
  if (responseTimes.length < 4) {
    return [];
  }

  const workerValues = responseTimes.map((point) => point.workerMs);
  const baseline = workerValues.slice(0, -1);
  const expected = Math.round(baseline.reduce((total, value) => total + value, 0) / baseline.length);
  const observed = workerValues[workerValues.length - 1];

  if (observed < expected * 1.25) {
    return [];
  }

  return [
    {
      id: `anomaly-worker-latency-${createdAt}`,
      service: "Queue Workers",
      metric: "latency",
      severity: observed >= expected * 1.6 ? "critical" : "warning",
      observed,
      expected,
      createdAt
    }
  ];
}
