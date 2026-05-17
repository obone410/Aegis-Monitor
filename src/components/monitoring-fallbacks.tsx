function ChartFallback({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <section className="panel chart-panel" aria-label={title}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="chart-frame chart-skeleton" />
    </section>
  );
}

export function LatencyChartFallback() {
  return <ChartFallback eyebrow="Performance" title="API Response Times" />;
}

export function ThroughputChartFallback() {
  return <ChartFallback eyebrow="Volume / errors" title="Traffic and Deploys" />;
}
