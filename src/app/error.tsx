"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="dashboard-shell">
      <section className="panel error-panel">
        <p className="eyebrow">Recovery</p>
        <h1>Monitoring workspace failed to load</h1>
        <p className="subtitle">{error.message}</p>
        <button className="icon-button text-command" type="button" onClick={reset}>
          Retry
        </button>
      </section>
    </main>
  );
}
