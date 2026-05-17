import { VercelDeploymentRepository } from "@/server/adapters/vercel-deployments";
import { SupabaseTelemetryRepository } from "@/server/repositories/telemetry-repository";

export async function fetchVercelDeployments() {
  const repository = VercelDeploymentRepository.fromEnv();
  return repository ? repository.listDeployments() : null;
}

export async function fetchSupabaseTelemetry() {
  const repository = SupabaseTelemetryRepository.fromEnv();

  if (!repository) {
    return null;
  }

  const [services, logs] = await Promise.all([repository.listServices(), repository.listLogs()]);
  return {
    services,
    logs
  };
}
