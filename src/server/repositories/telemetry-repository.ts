import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildDeployments,
  buildLogs,
  buildServiceMetrics
} from "@/lib/monitoring/mock-data";
import type { DeploymentEvent, LogEvent, ServiceMetric } from "@/types/monitoring";
import { getEnv } from "../env";
import { logger } from "../logger";

export interface TelemetryRepository {
  listServices(): Promise<ServiceMetric[]>;
  listLogs(): Promise<LogEvent[]>;
}

export interface DeploymentRepository {
  listDeployments(): Promise<DeploymentEvent[]>;
}

export class DemoTelemetryRepository implements TelemetryRepository, DeploymentRepository {
  constructor(private readonly now = new Date()) {}

  async listServices() {
    return buildServiceMetrics(this.now);
  }

  async listLogs() {
    return buildLogs(this.now);
  }

  async listDeployments() {
    return buildDeployments(this.now);
  }
}

const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);

function mapServiceRow(row: Record<string, unknown>): ServiceMetric {
  return {
    id: asString(row.id),
    name: asString(row.name),
    region: asString(row.region),
    environment: asString(row.environment, "production") as ServiceMetric["environment"],
    uptime: asNumber(row.uptime),
    sloTarget: asNumber(row.sloTarget ?? row.slo_target, 99.9),
    p95LatencyMs: asNumber(row.p95LatencyMs ?? row.p95_latency_ms),
    errorRate: asNumber(row.errorRate ?? row.error_rate),
    requestsPerMinute: asNumber(row.requestsPerMinute ?? row.requests_per_minute),
    cpuLoad: asNumber(row.cpuLoad ?? row.cpu_load),
    memoryLoad: asNumber(row.memoryLoad ?? row.memory_load),
    dependencies: Array.isArray(row.dependencies) ? (row.dependencies as string[]) : [],
    updatedAt: asString(row.updatedAt ?? row.updated_at, new Date().toISOString())
  };
}

function mapLogRow(row: Record<string, unknown>): LogEvent {
  return {
    id: asString(row.id),
    timestamp: asString(row.timestamp, new Date().toISOString()),
    service: asString(row.service),
    level: asString(row.level, "info") as LogEvent["level"],
    message: asString(row.message),
    requestId: asString(row.requestId ?? row.request_id),
    traceId: asString(row.traceId ?? row.trace_id)
  };
}

export class SupabaseTelemetryRepository implements TelemetryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  static fromEnv() {
    const env = getEnv();
    const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return null;
    }

    return new SupabaseTelemetryRepository(
      createClient(url, key, {
        auth: {
          persistSession: false
        }
      })
    );
  }

  async listServices() {
    const { data, error } = await this.supabase
      .from("service_metrics")
      .select(
        "id,name,region,environment,uptime,slo_target,p95_latency_ms,error_rate,requests_per_minute,cpu_load,memory_load,dependencies,updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(24);

    if (error) {
      logger.warn("supabase_services_query_failed", { message: error.message });
      return [];
    }

    return (data as Record<string, unknown>[]).map(mapServiceRow);
  }

  async listLogs() {
    const { data, error } = await this.supabase
      .from("deployment_logs")
      .select("id,timestamp,service,level,message,request_id,trace_id")
      .order("timestamp", { ascending: false })
      .limit(40);

    if (error) {
      logger.warn("supabase_logs_query_failed", { message: error.message });
      return [];
    }

    return (data as Record<string, unknown>[]).map(mapLogRow);
  }
}
