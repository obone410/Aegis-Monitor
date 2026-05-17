import {
  AlertCircle,
  Ban,
  CheckCircle2,
  CircleDot,
  Clock3,
  LoaderCircle,
  TriangleAlert
} from "lucide-react";
import type { AlertSeverity, DeploymentStatus, HealthStatus, LogLevel } from "@/lib/monitoring/types";

type StatusValue = HealthStatus | DeploymentStatus | LogLevel | AlertSeverity;

const iconMap: Record<string, typeof CheckCircle2> = {
  operational: CheckCircle2,
  ready: CheckCircle2,
  info: CircleDot,
  degraded: TriangleAlert,
  warning: TriangleAlert,
  warn: TriangleAlert,
  incident: AlertCircle,
  critical: AlertCircle,
  error: AlertCircle,
  building: LoaderCircle,
  queued: Clock3,
  canceled: Ban,
  debug: CircleDot
};

export function StatusPill({ status, label }: { status: StatusValue; label?: string }) {
  const Icon = iconMap[status] ?? CircleDot;

  return (
    <span className={`status-pill status-${status}`}>
      <Icon aria-hidden="true" size={14} />
      {label ?? status}
    </span>
  );
}
