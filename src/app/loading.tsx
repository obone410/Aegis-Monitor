export default function Loading() {
  return (
    <main className="dashboard-shell">
      <section className="topbar skeleton-block" />
      <section className="overview-grid" aria-label="Loading dashboard">
        {Array.from({ length: 4 }, (_, index) => (
          <article className="metric-card skeleton-block" key={index} />
        ))}
      </section>
    </main>
  );
}
