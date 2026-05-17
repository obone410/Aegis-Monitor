import { NextResponse } from "next/server";
import { getEnvIssues } from "@/server/env";

export const dynamic = "force-dynamic";

export function GET() {
  const envIssues = getEnvIssues();

  return NextResponse.json({
    status: envIssues.length ? "degraded" : "ok",
    checkedAt: new Date().toISOString(),
    checks: {
      app: "ok",
      environment: envIssues.length ? "degraded" : "ok"
    },
    envIssues: envIssues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }))
  });
}
