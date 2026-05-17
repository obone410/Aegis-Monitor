import { BellPlus, Siren } from "lucide-react";
import type { AlertEvent } from "@/lib/monitoring/types";
import { StatusPill } from "./status-pill";

const formatAlertTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));

export function AlertCenter({
  alerts,
  onSimulate
}: {
  alerts: AlertEvent[];
  onSimulate: () => void;
}) {
  return (
    <section className="panel alerts-panel" aria-labelledby="alerts-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Escalation</p>
          <h2 id="alerts-title">Alert Center</h2>
        </div>
        <button className="icon-button text-command" type="button" onClick={onSimulate} title="Simulate alert">
          <BellPlus aria-hidden="true" size={17} />
          Simulate alert
        </button>
      </div>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article className="alert-item" data-severity={alert.severity} key={alert.id}>
            <Siren aria-hidden="true" size={18} />
            <div>
              <div className="alert-title-row">
                <strong>{alert.title}</strong>
                <StatusPill status={alert.severity} />
              </div>
              <p>{alert.description}</p>
              <span>
                {alert.service} · {formatAlertTime(alert.createdAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
