import { classifyHealth } from "@/lib/monitoring/analytics";
import type { ServiceMetric } from "@/lib/monitoring/types";
import { StatusPill } from "./status-pill";

export function ServiceHealthGrid({ services }: { services: ServiceMetric[] }) {
  return (
    <section className="panel service-panel" aria-labelledby="service-health-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Health / availability</p>
          <h2 id="service-health-title">Service Status</h2>
        </div>
      </div>
      <div className="service-grid">
        {services.map((service) => {
          const status = classifyHealth(service);

          return (
            <article className="service-card" data-status={status} key={service.id}>
              <div className="service-card-header">
                <div>
                  <h3>{service.name}</h3>
                  <span>{service.region}</span>
                </div>
                <StatusPill status={status} />
              </div>
              <dl className="service-metrics">
                <div>
                  <dt>Uptime</dt>
                  <dd>{service.uptime.toFixed(2)}%</dd>
                </div>
                <div>
                  <dt>p95</dt>
                  <dd>{service.p95LatencyMs}ms</dd>
                </div>
                <div>
                  <dt>Errors</dt>
                  <dd>{service.errorRate.toFixed(2)}%</dd>
                </div>
                <div>
                  <dt>RPM</dt>
                  <dd>{service.requestsPerMinute.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="saturation-bars">
                <label>
                  <span>CPU</span>
                  <meter min="0" max="100" value={service.cpuLoad} />
                  <b>{service.cpuLoad}%</b>
                </label>
                <label>
                  <span>Memory</span>
                  <meter min="0" max="100" value={service.memoryLoad} />
                  <b>{service.memoryLoad}%</b>
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
