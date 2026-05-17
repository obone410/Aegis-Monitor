import type { DeploymentEvent } from "@/types/monitoring";
import { getEnv } from "../env";
import { logger } from "../logger";
import type { DeploymentRepository } from "../repositories/telemetry-repository";

type VercelDeployment = {
  uid?: string;
  id?: string;
  name?: string;
  url?: string | null;
  state?: string;
  readyState?: string;
  target?: string | null;
  created?: number;
  createdAt?: number;
  buildingAt?: number;
  ready?: number;
  creator?: {
    username?: string;
    email?: string;
  };
  meta?: {
    githubCommitSha?: string;
    githubCommitAuthorName?: string;
    githubCommitRef?: string;
  };
};

function normalizeDeploymentStatus(state: string | undefined): DeploymentEvent["status"] {
  switch (state) {
    case "READY":
      return "ready";
    case "BUILDING":
      return "building";
    case "QUEUED":
    case "INITIALIZING":
      return "queued";
    case "ERROR":
      return "error";
    case "CANCELED":
      return "canceled";
    default:
      return "queued";
  }
}

function normalizeEnvironment(target: string | null | undefined): DeploymentEvent["environment"] {
  if (target === "production" || target === "staging") {
    return target;
  }

  return "preview";
}

function mapVercelDeployment(deployment: VercelDeployment): DeploymentEvent {
  const createdAtMs = deployment.createdAt ?? deployment.created ?? Date.now();
  const endAtMs = deployment.ready ?? deployment.buildingAt ?? createdAtMs;
  const status = normalizeDeploymentStatus(deployment.readyState ?? deployment.state);

  return {
    id: deployment.uid ?? deployment.id ?? `vercel-${createdAtMs}`,
    service: deployment.name ?? "Vercel Project",
    environment: normalizeEnvironment(deployment.target),
    status,
    commitSha: deployment.meta?.githubCommitSha?.slice(0, 7) ?? "unknown",
    branch: deployment.meta?.githubCommitRef ?? "unknown",
    author:
      deployment.meta?.githubCommitAuthorName ??
      deployment.creator?.username ??
      deployment.creator?.email ??
      "Vercel",
    createdAt: new Date(createdAtMs).toISOString(),
    durationSeconds: Math.max(0, Math.round((endAtMs - createdAtMs) / 1000)),
    url: deployment.url ?? null,
    rollbackCandidate: status === "error"
  };
}

export class VercelDeploymentRepository implements DeploymentRepository {
  static fromEnv() {
    const env = getEnv();

    if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) {
      return null;
    }

    return new VercelDeploymentRepository(
      env.VERCEL_API_TOKEN,
      env.VERCEL_PROJECT_ID,
      env.VERCEL_TEAM_ID
    );
  }

  constructor(
    private readonly token: string,
    private readonly projectId: string,
    private readonly teamId?: string
  ) {}

  async listDeployments() {
    const params = new URLSearchParams({
      limit: "8",
      projectId: this.projectId
    });

    if (this.teamId) {
      params.set("teamId", this.teamId);
    }

    const response = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      next: {
        revalidate: 15
      }
    });

    if (!response.ok) {
      logger.warn("vercel_deployments_query_failed", { status: response.status });
      return [];
    }

    const body = (await response.json()) as { deployments?: VercelDeployment[] };
    return body.deployments?.map(mapVercelDeployment) ?? [];
  }
}
