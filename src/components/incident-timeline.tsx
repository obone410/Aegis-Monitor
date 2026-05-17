import { History } from "lucide-react";
import type { IncidentTimelineItem } from "@/types/monitoring";
import { StatusPill } from "./status-pill";

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));

export function IncidentTimeline({
  items,
  onOpen
}: {
  items: IncidentTimelineItem[];
  onOpen: () => void;
}) {
  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Incident response</p>
          <h2 id="timeline-title">Incident Timeline</h2>
        </div>
        <button className="icon-button text-command" type="button" onClick={onOpen}>
          <History aria-hidden="true" size={17} />
          Drawer
        </button>
      </div>
      <ol className="timeline-list">
        {items.slice(0, 6).map((item) => (
          <li data-type={item.type} key={item.id}>
            <time>{formatTime(item.timestamp)}</time>
            <div>
              <div className="timeline-title-row">
                <strong>{item.title}</strong>
                <StatusPill status={item.severity} />
              </div>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
