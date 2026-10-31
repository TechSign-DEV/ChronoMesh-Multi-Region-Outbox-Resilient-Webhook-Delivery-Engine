
import { MapPin, Server } from "lucide-react";

export default function RegionStatus({ regions = [] }) {
  return (
    <section className="monitor-section">
      <div className="monitor-section-heading">
        <div>
          <h2>Regional health</h2>
          <p>Heartbeat status of configured regions</p>
        </div>
        <MapPin size={20} />
      </div>

      {regions.length === 0 ? (
        <div className="monitor-empty">
          No region heartbeat records available.
        </div>
      ) : (
        <div className="monitor-region-grid">
          {regions.map((region) => (
            <article className="monitor-region-card" key={region.regionId}>
              <div className="monitor-region-header">
                <div className="monitor-region-icon">
                  <Server size={20} />
                </div>

                <span
                  className={`monitor-status ${String(
                    region.status
                  ).toLowerCase()}`}
                >
                  {region.status}
                </span>
              </div>

              <h3>{region.regionName}</h3>
              <p>{region.regionId}</p>

              <div className="monitor-region-stats">
                <span>Pending events</span>
                <strong>{region.pendingEvents ?? 0}</strong>
              </div>

              <div className="monitor-region-stats">
                <span>Active workers</span>
                <strong>{region.activeWorkers ?? 0}</strong>
              </div>

              <div className="monitor-region-last-seen">
                Last heartbeat:{" "}
                {region.lastHeartbeat
                  ? new Date(region.lastHeartbeat).toLocaleString()
                  : "Not available"}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
