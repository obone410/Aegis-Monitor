export type EnvironmentName = "production" | "preview" | "staging";

export type HealthStatus = "operational" | "degraded" | "incident";

export type DeploymentStatus = "ready" | "building" | "queued" | "error" | "canceled";

export type LogLevel = "info" | "warn" | "error" | "debug";

export type AlertSeverity = "info" | "warning" | "critical";

export type TimeWindow = "24h" | "7d";

export type ServiceMetric = {
  id: string;
  name: string;
  region: string;
  environment?: EnvironmentName;
  uptime: number;
  sloTarget?: number;
  p95LatencyMs: number;
  errorRate: number;
  requestsPerMinute: number;
  cpuLoad: number;
  memoryLoad: number;
  dependencies?: string[];
  updatedAt: string;
};

export type DeploymentEvent = {
  id: string;
  service: string;
  environment: EnvironmentName;
  status: DeploymentStatus;
  commitSha: string;
  branch?: string;
  author: string;
  createdAt: string;
  durationSeconds: number;
  url: string | null;
  rollbackCandidate?: boolean;
};

export type LogEvent = {
  id: string;
  timestamp: string;
  service: string;
  level: LogLevel;
  message: string;
  requestId: string;
  traceId?: string;
};

export type ResponsePoint = {
  time: string;
  apiMs: number;
  webMs: number;
  workerMs: number;
  errors: number;
};

export type ThroughputPoint = {
  time: string;
  requests: number;
  errors: number;
  deploys: number;
};

export type AlertEvent = {
  id: string;
  service: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  createdAt: string;
  runbook?: string;
  burnRate?: number;
};

export type IncidentEvent = {
  id: string;
  service: string;
  severity: "sev1" | "sev2" | "sev3";
  status: "open" | "investigating" | "mitigated" | "resolved";
  startedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  summary: string;
  owner: string;
};

export type IncidentTimelineItem = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: "deploy" | "log" | "alert" | "incident";
  severity: AlertSeverity;
};

export type RegionHealth = {
  region: string;
  services: number;
  status: HealthStatus;
  averageLatencyMs: number;
  averageUptime: number;
};

export type DependencyNode = {
  id: string;
  name: string;
  status: HealthStatus;
};

export type DependencyEdge = {
  from: string;
  to: string;
  status: HealthStatus;
};

export type DependencyGraph = {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
};

export type SloSummary = {
  service: string;
  target: number;
  actual: number;
  errorBudgetRemaining: number;
  burnRate: number;
  window: TimeWindow;
  status: HealthStatus;
};

export type DoraMetrics = {
  deploymentFrequencyPerDay: number;
  changeFailureRate: number;
  mttrMinutes: number;
  leadTimeMinutes: number;
};

export type AnomalyEvent = {
  id: string;
  service: string;
  metric: "latency" | "errors" | "traffic";
  severity: AlertSeverity;
  observed: number;
  expected: number;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  severity: AlertSeverity;
};

export type FeatureFlags = {
  sseLiveUpdates: boolean;
  apiKeyProtection: boolean;
  rbacSimulation: boolean;
  redisCache: boolean;
  telemetryQueue: boolean;
};

export type IncidentSummary = {
  operationalServices: number;
  degradedServices: number;
  incidentServices: number;
  averageUptime: number;
  averageP95LatencyMs: number;
  totalRequestsPerMinute: number;
  activeAlerts: number;
};

export type DeploymentStats = {
  total: number;
  ready: number;
  building: number;
  failed: number;
  averageDurationSeconds: number;
  productionFailureRate: number;
};

export type MonitoringSnapshot = {
  generatedAt: string;
  traceId: string;
  environment: EnvironmentName;
  services: ServiceMetric[];
  deployments: DeploymentEvent[];
  logs: LogEvent[];
  responseTimes: ResponsePoint[];
  throughput: ThroughputPoint[];
  alerts: AlertEvent[];
  incidents: IncidentEvent[];
  incidentTimeline: IncidentTimelineItem[];
  slos: SloSummary[];
  doraMetrics: DoraMetrics;
  regionHealth: RegionHealth[];
  dependencyGraph: DependencyGraph;
  anomalies: AnomalyEvent[];
  activity: ActivityEvent[];
  featureFlags: FeatureFlags;
  dataSources: string[];
};

export type ApiMeta = {
  traceId: string;
  generatedAt: string;
  cache: "hit" | "miss" | "bypass";
  role: "viewer" | "responder" | "admin";
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  ok: false;
  error: ApiErrorPayload;
  meta: ApiMeta;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type AuditLogEntry = {
  id: string;
  traceId: string;
  actor: string;
  action: string;
  resource: string;
  role: ApiMeta["role"];
  timestamp: string;
  outcome: "allowed" | "denied";
};
