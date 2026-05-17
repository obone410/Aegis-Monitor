import type { NextRequest } from "next/server";
import type { ApiMeta } from "@/types/monitoring";
import { getEnv } from "./env";

export function getClientRole(request: NextRequest): ApiMeta["role"] {
  const role = request.headers.get("x-ops-role");

  if (role === "admin" || role === "responder" || role === "viewer") {
    return role;
  }

  return "viewer";
}

export function authorizeRequest(request: NextRequest) {
  const env = getEnv();
  const role = getClientRole(request);
  const configuredKey = env.MONITORING_API_KEY;
  const providedKey = request.headers.get("x-api-key");
  const requiresKey = env.MONITORING_REQUIRE_API_KEY || Boolean(configuredKey);

  if (!requiresKey) {
    return {
      allowed: true as const,
      role
    };
  }

  if (configuredKey && providedKey === configuredKey) {
    return {
      allowed: true as const,
      role
    };
  }

  return {
    allowed: false as const,
    role,
    reason: "Missing or invalid monitoring API key"
  };
}
