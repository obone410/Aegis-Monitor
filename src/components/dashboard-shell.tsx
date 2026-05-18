"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Clock3,
  GitBranch,
  Moon,
  RefreshCw,
  Search,
  ShieldAlert,
  Sun,
  Wifi,
  WifiOff,
  Workflow,
  X
} from "lucide-react";
import {
  buildSyntheticAlert,
  calculateIncidentSummary,
  deriveDeploymentStats
} from "@/lib/monitoring/analytics";
import { useMonitoringSnapshot } from "@/hooks/use-monitoring-snapshot";
import type { AlertEvent, EnvironmentName } from "@/types/monitoring";
import { ActivityFeed } from "./activity-feed";
import { AlertCenter } from "./alert-center";
import { DeploymentTable } from "./deployment-table";
import { IncidentTimeline } from "./incident-timeline";
import { LogStream } from "./log-stream";
import { MetricCard } from "./metric-card";
import { LatencyChartFallback, ThroughputChartFallback } from "./monitoring-fallbacks";
import { DependencyGraphPanel, RegionHealthPanel } from "./region-dependency-panels";
import { ReleaseIntelligencePanel } from "./release-intelligence-panel";
import { ServiceHealthGrid } from "./service-health-grid";
import { SloBoard } from "./slo-board";

const LatencyChart = dynamic(
  () => import("./monitoring-charts").then((module) => module.LatencyChart),
  {
    ssr: false,
    loading: () => <LatencyChartFallback />
  }
);

const ThroughputChart = dynamic(
  () => import("./monitoring-charts").then((module) => module.ThroughputChart),
  {
    ssr: false,
    loading: () => <ThroughputChartFallback />
  }
);

const formatGeneratedAt = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));

export function DashboardShell() {
  const [environment, setEnvironment] = useState<EnvironmentName>("production");
  const [live, setLive] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [manualAlerts, setManualAlerts] = useState<AlertEvent[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const { snapshot, meta, error, isRefreshing, refresh } = useMonitoringSnapshot({
    environment,
    live
  });

  const summary = useMemo(
    () => calculateIncidentSummary(snapshot.services, snapshot.logs),
    [snapshot.services, snapshot.logs]
  );
  const deploymentStats = useMemo(
    () => deriveDeploymentStats(snapshot.deployments),
    [snapshot.deployments]
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key.toLowerCase() === "r") {
        void refresh();
      }

      if (event.key.toLowerCase() === "t") {
        setTheme((current) => (current === "light" ? "dark" : "light"));
      }

      if (event.key.toLowerCase() === "a") {
        const alert = buildSyntheticAlert(snapshot.services, new Date().toISOString());
        setManualAlerts((current) => [alert, ...current].slice(0, 3));
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [refresh, snapshot.services]);

  const handleSimulateAlert = () => {
    const alert = buildSyntheticAlert(snapshot.services, new Date().toISOString());
    setManualAlerts((current) => [alert, ...current].slice(0, 3));
  };

  const alerts = [...manualAlerts, ...snapshot.alerts].slice(0, 4);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredServices = snapshot.services.filter((service) =>
    [service.name, service.region, service.environment ?? ""].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    )
  );
  const filteredDeployments = snapshot.deployments.filter((deployment) =>
    [
      deployment.service,
      deployment.environment,
      deployment.status,
      deployment.commitSha,
      deployment.branch ?? ""
    ].some((value) => value.toLowerCase().includes(normalizedQuery))
  );
  const filteredLogs = snapshot.logs.filter((log) =>
    [log.service, log.level, log.message, log.requestId].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    )
  );

  return (
    <main className="dashboard-shell" data-theme={theme}>
      <header className="topbar">
        <div>
          <p className="eyebrow">DevOps control plane</p>
          <h1>Aegis-Monitor</h1>
          <p className="subtitle">
            Release health, SLO burn, incidents, telemetry, and deployment risk in one operations console.
          </p>
        </div>
        <div className="topbar-actions">
          <div className="live-badge" aria-label="Live metrics enabled">
            <span />
            {live ? "SSE Live" : "Polling"}
          </div>
          <button className="icon-button text-command" type="button" onClick={refresh} title="Refresh metrics">
            <RefreshCw aria-hidden="true" className={isRefreshing ? "spin" : ""} size={17} />
            Refresh
          </button>
        </div>
      </header>

      <section className="command-center" aria-label="Dashboard controls">
        <label className="search-box">
          <Search aria-hidden="true" size={17} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services, deploys, logs"
            aria-label="Search services, deploys, logs"
          />
        </label>
        <div className="segmented-control" aria-label="Environment">
          {(["production", "preview", "staging"] as EnvironmentName[]).map((value) => (
            <button
              className={environment === value ? "is-active" : ""}
              key={value}
              type="button"
              onClick={() => setEnvironment(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <button className="icon-button text-command" type="button" onClick={() => setLive((value) => !value)}>
          {live ? <Wifi aria-hidden="true" size={17} /> : <WifiOff aria-hidden="true" size={17} />}
          {live ? "Live" : "Manual"}
        </button>
        <button
          className="icon-button text-command"
          type="button"
          onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        >
          {theme === "light" ? <Moon aria-hidden="true" size={17} /> : <Sun aria-hidden="true" size={17} />}
          Theme
        </button>
      </section>

      {error ? (
        <div className="notice" role="status">
          {error}. Showing last known telemetry snapshot.
        </div>
      ) : null}

      <section className="overview-grid" aria-label="Monitoring summary">
        <MetricCard
          label="Operational Services"
          value={`${summary.operationalServices}/${snapshot.services.length}`}
          detail={`${summary.degradedServices} degraded · ${summary.incidentServices} incident`}
          icon={<Activity size={22} />}
          tone={summary.incidentServices ? "danger" : summary.degradedServices ? "warn" : "good"}
        />
        <MetricCard
          label="Average p95"
          value={`${summary.averageP95LatencyMs}ms`}
          detail={`${summary.totalRequestsPerMinute.toLocaleString()} requests/min`}
          icon={<Clock3 size={22} />}
          tone={summary.averageP95LatencyMs > 500 ? "warn" : "good"}
        />
        <MetricCard
          label="Deploy Success"
          value={`${deploymentStats.ready}/${deploymentStats.total}`}
          detail={`${deploymentStats.averageDurationSeconds}s average build`}
          icon={<GitBranch size={22} />}
          tone={deploymentStats.failed ? "warn" : "good"}
        />
        <MetricCard
          label="Active Alerts"
          value={`${summary.activeAlerts + manualAlerts.length}`}
          detail={`${deploymentStats.productionFailureRate}% production failure rate`}
          icon={<ShieldAlert size={22} />}
          tone={summary.activeAlerts + manualAlerts.length ? "danger" : "neutral"}
        />
      </section>

      <section className="pipeline-strip" aria-label="Deployment pipeline">
        {[
          ["Build", "ready"],
          ["Preview", "ready"],
          ["Promote", deploymentStats.building ? "building" : "ready"],
          ["Monitor", summary.incidentServices ? "incident" : "operational"],
          ["Rollback", deploymentStats.failed ? "queued" : "ready"]
        ].map(([label, state]) => (
          <div className="pipeline-step" data-state={state} key={label}>
            <Workflow aria-hidden="true" size={16} />
            <strong>{label}</strong>
          </div>
        ))}
      </section>

      <div className="source-row">
        <span>Updated {formatGeneratedAt(snapshot.generatedAt)}</span>
        {meta ? <span>Trace {meta.traceId.slice(0, 18)}</span> : null}
        {meta ? <b>Cache {meta.cache}</b> : null}
        <b>Role {meta?.role ?? "viewer"}</b>
        {snapshot.dataSources.map((source) => (
          <b key={source}>{source}</b>
        ))}
      </div>

      <SloBoard slos={snapshot.slos} doraMetrics={snapshot.doraMetrics} />

      <ReleaseIntelligencePanel
        readiness={snapshot.productionReadiness}
        risks={snapshot.deploymentRisks}
      />

      <ServiceHealthGrid services={filteredServices} />

      <section className="chart-grid" aria-label="Monitoring charts">
        <LatencyChart data={snapshot.responseTimes} />
        <ThroughputChart data={snapshot.throughput} />
      </section>

      <section className="ops-grid" aria-label="SRE workspace">
        <IncidentTimeline items={snapshot.incidentTimeline} onOpen={() => setDrawerOpen(true)} />
        <ActivityFeed activity={snapshot.activity} anomalies={snapshot.anomalies} />
      </section>

      <section className="ops-grid" aria-label="Cloud topology">
        <RegionHealthPanel regions={snapshot.regionHealth} />
        <DependencyGraphPanel graph={snapshot.dependencyGraph} />
      </section>

      <section className="ops-grid" aria-label="Operations workspace">
        <DeploymentTable deployments={filteredDeployments} />
        <LogStream logs={filteredLogs} />
      </section>

      <AlertCenter alerts={alerts} onSimulate={handleSimulateAlert} />

      {drawerOpen ? (
        <aside className="incident-drawer" aria-label="Incident drawer">
          <div className="drawer-surface">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Commander view</p>
                <h2>Open Incidents</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setDrawerOpen(false)}
                title="Close incident drawer"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="drawer-list">
              {snapshot.incidents.map((incident) => (
                <article key={incident.id}>
                  <strong>
                    {incident.severity.toUpperCase()} · {incident.service}
                  </strong>
                  <p>{incident.summary}</p>
                  <span>
                    {incident.status} · owner {incident.owner}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </main>
  );
}
