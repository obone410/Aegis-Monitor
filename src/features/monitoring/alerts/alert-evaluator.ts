import { buildSyntheticAlert, calculateBurnRate, classifyHealth } from "../analytics/monitoring-analytics";
import type { AlertEvent, ServiceMetric } from "@/types/monitoring";

export function evaluateBurnRateAlerts(
  services: ServiceMetric[],
  createdAt = new Date().toISOString()
): AlertEvent[] {
  const burnRateAlerts = services
    .filter((service) => calculateBurnRate(service) >= 2 || classifyHealth(service) !== "operational")
    .map((service) => {
      const alert = buildSyntheticAlert([service], createdAt);
      return {
        ...alert,
        title: `${service.name} burn rate is ${alert.burnRate}x`
      };
    });

  return burnRateAlerts.length ? burnRateAlerts : [buildSyntheticAlert(services, createdAt)];
}
