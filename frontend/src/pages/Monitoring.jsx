
import Sidebar from "../components/Sidebar";
import MonitoringHeader from "../components/MonitoringHeader";
import QueueMetrics from "../components/QueueMetrics";
import RegionStatus from "../components/RegionStatus";
import WorkerTable from "../components/WorkerTable";

import useMonitoring from "../hooks/useMonitoring";

import "../App.css";

export default function Monitoring() {
  const {
    monitoring,
    workers,
    loading,
    error,
    refresh,
  } = useMonitoring();

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <div className="monitor-page">
          <MonitoringHeader
            regionId={monitoring?.regionId}
            capturedAt={monitoring?.capturedAt}
            onRefresh={refresh}
            loading={loading}
          />

          {error && (
            <div className="monitor-error">
              {error}
              <button onClick={refresh}>Try again</button>
            </div>
          )}

          {loading && !monitoring ? (
            <div className="monitor-loading">
              Loading system monitoring...
            </div>
          ) : monitoring ? (
            <>
              <QueueMetrics queue={monitoring.queue} />

              <RegionStatus regions={monitoring.regions || []} />

              <WorkerTable workers={workers} />
            </>
          ) : (
            <div className="monitor-empty">
              Monitoring information is currently unavailable.
            </div>
          )}

          <p className="monitor-auto-refresh">
            Dashboard automatically refreshes every 15 seconds.
          </p>
        </div>
      </main>
    </div>
  );
}
