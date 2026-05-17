import { RadioTower } from "lucide-react";
import type { ActivityEvent, AnomalyEvent } from "@/types/monitoring";
import { StatusPill } from "./status-pill";

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));

export function ActivityFeed({
  activity,
  anomalies
}: {
  activity: ActivityEvent[];
  anomalies: AnomalyEvent[];
}) {
  return (
    <section className="panel" aria-labelledby="activity-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Realtime operations</p>
          <h2 id="activity-title">Activity Feed</h2>
        </div>
        <RadioTower aria-hidden="true" size={20} />
      </div>
      <ol className="activity-list">
        {anomalies.map((anomaly) => (
          <li key={anomaly.id}>
            <time>{formatTime(anomaly.createdAt)}</time>
            <StatusPill status={anomaly.severity} />
            <p>
              {anomaly.service} {anomaly.metric} anomaly: {anomaly.observed} vs expected{" "}
              {anomaly.expected}
            </p>
          </li>
        ))}
        {activity.map((event) => (
          <li key={event.id}>
            <time>{formatTime(event.timestamp)}</time>
            <StatusPill status={event.severity} />
            <p>
              <strong>{event.actor}</strong> {event.action} on {event.target}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
