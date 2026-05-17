import {
  buildDependencyGraph,
  buildIncidentTimeline,
  buildIncidents,
  buildRegionHealth,
  buildSloSummaries,
  calculateDeploymentRiskProfiles,
  calculateDoraMetrics,
  calculateProductionReadiness,
  detectAnomalies
} from "@/features/monitoring/analytics/monitoring-analytics";
import { evaluateBurnRateAlerts } from "@/features/monitoring/alerts/alert-evaluator";
import { buildDemoSnapshot, buildResponseTimes, buildThroughput } from "@/lib/monitoring/mock-data";
import type { EnvironmentName, MonitoringSnapshot } from "@/types/monitoring";
import { getEnv } from "../env";
import { VercelDeploymentRepository } from "../adapters/vercel-deployments";
import {
  DemoTelemetryRepository,
  SupabaseTelemetryRepository,
  type DeploymentRepository,
  type TelemetryRepository
} from "../repositories/telemetry-repository";
import { getCacheClient } from "../cache";
import { getQueueDepth } from "../telemetry-queue";

type MonitoringServiceOptions = {
  traceId: string;
  environment?: EnvironmentName;
  bypassCache?: boolean;
};

export class MonitoringService {
  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly deploymentRepository: DeploymentRepository,
    private readonly demoRepository: DemoTelemetryRepository
  ) {}

  static fromEnv(now = new Date()) {
    const demoRepository = new DemoTelemetryRepository(now);
    const supabaseRepository = SupabaseTelemetryRepository.fromEnv();
    const vercelRepository = VercelDeploymentRepository.fromEnv();

    return new MonitoringService(
      supabaseRepository ?? demoRepository,
      vercelRepository ?? demoRepository,
      demoRepository
    );
  }

  async getSnapshot(options: MonitoringServiceOptions): Promise<{
    snapshot: MonitoringSnapshot;
    cache: "hit" | "miss" | "bypass";
  }> {
    const cache = getCacheClient();
    const env = getEnv();
    const cacheKey = `monitoring:${options.environment ?? "production"}`;

    if (!options.bypassCache) {
      const cached = await cache.get<MonitoringSnapshot>(cacheKey);

      if (cached) {
        return {
          snapshot: {
            ...cached,
            traceId: options.traceId
          },
          cache: "hit"
        };
      }
    }

    const demo = buildDemoSnapshot();
    const [servicesResult, logsResult, deploymentsResult] = await Promise.all([
      this.telemetryRepository.listServices(),
      this.telemetryRepository.listLogs(),
      this.deploymentRepository.listDeployments()
    ]);

    const services = servicesResult.length ? servicesResult : demo.services;
    const logs = logsResult.length ? logsResult : demo.logs;
    const deployments = deploymentsResult.length ? deploymentsResult : demo.deployments;
    const responseTimes = buildResponseTimes();
    const throughput = buildThroughput();
    const alerts = evaluateBurnRateAlerts(services, demo.generatedAt).slice(0, 3);
    const incidents = buildIncidents(services);
    const slos = buildSloSummaries(services, "24h");
    const deploymentRisks = calculateDeploymentRiskProfiles(deployments, services, incidents, slos);
    const dataSources = [
      servicesResult.length || logsResult.length ? "Supabase telemetry" : "Demo telemetry stream",
      deploymentsResult.length ? "Vercel Deployments API" : "Demo deployment feed"
    ];

    const snapshot: MonitoringSnapshot = {
      ...demo,
      traceId: options.traceId,
      environment: options.environment ?? "production",
      services,
      logs,
      deployments,
      responseTimes,
      throughput,
      alerts,
      incidents,
      incidentTimeline: buildIncidentTimeline(logs, deployments, alerts, incidents),
      slos,
      doraMetrics: calculateDoraMetrics(deployments, incidents),
      regionHealth: buildRegionHealth(services),
      dependencyGraph: buildDependencyGraph(services),
      anomalies: detectAnomalies(responseTimes, demo.generatedAt),
      deploymentRisks,
      productionReadiness: calculateProductionReadiness(services, deployments, incidents, slos),
      featureFlags: {
        sseLiveUpdates: true,
        apiKeyProtection: Boolean(env.MONITORING_API_KEY || env.MONITORING_REQUIRE_API_KEY),
        rbacSimulation: true,
        redisCache: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
        telemetryQueue: true
      },
      activity: [
        {
          id: "queue-depth",
          timestamp: demo.generatedAt,
          actor: "telemetry-worker",
          action: `processed queue depth ${getQueueDepth()}`,
          target: "ingestion pipeline",
          severity: "info"
        },
        ...demo.activity
      ],
      dataSources
    };

    await cache.set(cacheKey, snapshot, 10);
    return {
      snapshot,
      cache: options.bypassCache ? "bypass" : "miss"
    };
  }
}
