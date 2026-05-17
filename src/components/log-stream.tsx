import { TerminalSquare } from "lucide-react";
import type { LogEvent } from "@/lib/monitoring/types";
import { StatusPill } from "./status-pill";

const formatLogTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));

export function LogStream({ logs }: { logs: LogEvent[] }) {
  return (
    <section className="panel logs-panel" aria-labelledby="logs-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Runtime events</p>
          <h2 id="logs-title">Deployment Logs</h2>
        </div>
        <TerminalSquare aria-hidden="true" size={20} />
      </div>
      <ol className="log-list">
        {logs.map((log) => (
          <li key={log.id}>
            <time>{formatLogTime(log.timestamp)}</time>
            <StatusPill status={log.level} />
            <div>
              <strong>{log.service}</strong>
              <p>{log.message}</p>
              <span>{log.requestId}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
