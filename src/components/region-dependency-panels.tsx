import { GitFork, MapPinned } from "lucide-react";
import type { DependencyGraph, RegionHealth } from "@/types/monitoring";
import { StatusPill } from "./status-pill";

export function RegionHealthPanel({ regions }: { regions: RegionHealth[] }) {
  return (
    <section className="panel" aria-labelledby="region-health-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Cloud regions</p>
          <h2 id="region-health-title">Region Health</h2>
        </div>
        <MapPinned aria-hidden="true" size={20} />
      </div>
      <div className="region-list">
        {regions.map((region) => (
          <article key={region.region}>
            <div>
              <strong>{region.region}</strong>
              <span>{region.services} services</span>
            </div>
            <StatusPill status={region.status} />
            <span>{region.averageLatencyMs}ms p95</span>
            <span>{region.averageUptime}% uptime</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DependencyGraphPanel({ graph }: { graph: DependencyGraph }) {
  return (
    <section className="panel" aria-labelledby="dependency-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Dependency graph</p>
          <h2 id="dependency-title">Service Dependencies</h2>
        </div>
        <GitFork aria-hidden="true" size={20} />
      </div>
      <div className="dependency-map">
        {graph.nodes.map((node) => (
          <article data-status={node.status} key={node.id}>
            <strong>{node.name}</strong>
            <StatusPill status={node.status} />
            <span>
              {(graph.edges.filter((edge) => edge.from === node.id).map((edge) => edge.to).join(", ") ||
                "no downstream deps")}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
