import { ShieldCheck } from "lucide-react";
import type { DeploymentRiskProfile, ProductionReadiness } from "@/types/monitoring";
import { StatusPill } from "./status-pill";

export function ReleaseIntelligencePanel({
  risks,
  readiness
}: {
  risks: DeploymentRiskProfile[];
  readiness: ProductionReadiness;
}) {
  const latestRisk = risks[0];

  return (
    <section className="panel release-panel" aria-labelledby="release-intelligence-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Release intelligence</p>
          <h2 id="release-intelligence-title">Production Readiness</h2>
        </div>
        <ShieldCheck aria-hidden="true" size={20} />
      </div>

      <div className="readiness-score" data-status={readiness.status}>
        <strong>{readiness.score}</strong>
        <div>
          <StatusPill status={readiness.status === "ready" ? "operational" : readiness.status === "watch" ? "degraded" : "incident"} />
          <p>{readiness.summary}</p>
        </div>
      </div>

      <div className="readiness-grid">
        {readiness.indicators.map((indicator) => (
          <article key={indicator.label}>
            <span>{indicator.label}</span>
            <StatusPill status={indicator.status} />
            <p>{indicator.detail}</p>
          </article>
        ))}
      </div>

      {latestRisk ? (
        <article className="risk-profile">
          <div className="risk-profile-head">
            <div>
              <span>Latest deployment</span>
              <strong>{latestRisk.service}</strong>
            </div>
            <b>{latestRisk.releaseConfidence}% confidence</b>
          </div>
          <p>{latestRisk.recommendation}</p>
          <dl>
            <div>
              <dt>Risk</dt>
              <dd>{latestRisk.riskScore}/100</dd>
            </div>
            <div>
              <dt>Incidents</dt>
              <dd>{latestRisk.correlatedIncidents}</dd>
            </div>
            <div>
              <dt>Rollback</dt>
              <dd>{latestRisk.rollbackRecommended ? "recommended" : "not required"}</dd>
            </div>
          </dl>
        </article>
      ) : (
        <p className="empty-state">No deployment risk profiles available.</p>
      )}
    </section>
  );
}
