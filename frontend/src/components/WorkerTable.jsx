
import { Cpu } from "lucide-react";

export default function WorkerTable({ workers = [] }) {
  return (
    <section className="monitor-section">
      <div className="monitor-section-heading">
        <div>
          <h2>Worker activity</h2>
          <p>Recently reporting delivery workers</p>
        </div>
        <Cpu size={20} />
      </div>

      {workers.length === 0 ? (
        <div className="monitor-empty">
          No active worker heartbeat records available.
        </div>
      ) : (
        <div className="monitor-table-wrapper">
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Region</th>
                <th>Status</th>
                <th>Active jobs</th>
                <th>Last heartbeat</th>
              </tr>
            </thead>

            <tbody>
              {workers.map((worker) => (
                <tr key={worker.workerId}>
                  <td>{worker.workerId}</td>
                  <td>{worker.regionId}</td>
                  <td>
                    <span
                      className={`monitor-status ${String(
                        worker.status
                      ).toLowerCase()}`}
                    >
                      {worker.status}
                    </span>
                  </td>
                  <td>{worker.activeJobs}</td>
                  <td>
                    {new Date(worker.lastHeartbeat).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
