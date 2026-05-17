import { GitCommitHorizontal, Rocket } from "lucide-react";
import type { DeploymentEvent } from "@/lib/monitoring/types";
import { StatusPill } from "./status-pill";

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(new Date(timestamp));

export function DeploymentTable({ deployments }: { deployments: DeploymentEvent[] }) {
  return (
    <section className="panel deployment-panel" aria-labelledby="deployments-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CI/CD releases</p>
          <h2 id="deployments-title">Deployment Activity</h2>
        </div>
        <Rocket aria-hidden="true" size={20} />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Environment</th>
              <th>Status</th>
              <th>Commit</th>
              <th>Duration</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((deployment) => (
              <tr key={deployment.id}>
                <td data-label="Service">
                  <strong>{deployment.service}</strong>
                  <span>{deployment.author}</span>
                </td>
                <td data-label="Environment">{deployment.environment}</td>
                <td data-label="Status">
                  <StatusPill status={deployment.status} />
                </td>
                <td data-label="Commit">
                  <span className="commit">
                    <GitCommitHorizontal aria-hidden="true" size={15} />
                    {deployment.commitSha}
                  </span>
                </td>
                <td data-label="Duration">{deployment.durationSeconds}s</td>
                <td data-label="Created">{formatTime(deployment.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
