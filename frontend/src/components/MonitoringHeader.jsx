
import { Activity, RefreshCw } from "lucide-react";

export default function MonitoringHeader({
  regionId,
  capturedAt,
  onRefresh,
  loading,
}) {
  return (
    <div className="monitor-page-header">
      <div>
        <div className="monitor-title-row">
          <Activity size={25} />
          <h1>System Monitoring</h1>
        </div>

        <p>
          Queue performance, worker activity and regional health.
        </p>

        <div className="monitor-header-meta">
          <span>Region: {regionId || "Unknown"}</span>
          <span>
            Updated:{" "}
            {capturedAt
              ? new Date(capturedAt).toLocaleTimeString()
              : "Waiting for data"}
          </span>
        </div>
      </div>

      <button
        className="monitor-refresh-button"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw size={16} className={loading ? "monitor-spinning" : ""} />
        Refresh
      </button>
    </div>
  );
}
