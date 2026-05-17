import { GaugeCircle } from "lucide-react";
import type { DoraMetrics, SloSummary } from "@/types/monitoring";
import { StatusPill } from "./status-pill";

export function SloBoard({ slos, doraMetrics }: { slos: SloSummary[]; doraMetrics: DoraMetrics }) {
  return (
    <section className="panel slo-panel" aria-labelledby="slo-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SRE controls</p>
          <h2 id="slo-title">SLOs and Error Budgets</h2>
        </div>
        <GaugeCircle aria-hidden="true" size={20} />
      </div>
      <div className="slo-grid">
        {slos.map((slo) => (
          <article className="slo-card" data-status={slo.status} key={slo.service}>
            <div className="slo-card-head">
              <strong>{slo.service}</strong>
              <StatusPill status={slo.status} />
            </div>
            <dl>
              <div>
                <dt>Target</dt>
                <dd>{slo.target}%</dd>
              </div>
              <div>
                <dt>Actual</dt>
                <dd>{slo.actual.toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{slo.errorBudgetRemaining}%</dd>
              </div>
              <div>
                <dt>Burn</dt>
                <dd>{slo.burnRate}x</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="dora-strip">
        <span>
          <b>{doraMetrics.deploymentFrequencyPerDay}</b> deploys/day
        </span>
        <span>
          <b>{doraMetrics.changeFailureRate}%</b> change failure
        </span>
        <span>
          <b>{doraMetrics.mttrMinutes}m</b> MTTR
        </span>
        <span>
          <b>{doraMetrics.leadTimeMinutes}m</b> lead time
        </span>
      </div>
    </section>
  );
}
