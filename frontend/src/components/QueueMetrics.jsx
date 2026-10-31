
import MetricCard from "./MetricCard";

export default function QueueMetrics({ queue = {} }) {
  const metrics = [
    { label: "Waiting", value: queue.waiting, type: "waiting" },
    { label: "Active", value: queue.active, type: "active" },
    { label: "Completed", value: queue.completed, type: "completed" },
    { label: "Failed", value: queue.failed, type: "failed" },
    { label: "Delayed", value: queue.delayed, type: "waiting" },
    { label: "Paused", value: queue.paused, type: "active" },
  ];

  return (
    <section className="monitor-section">
      <div className="monitor-section-heading">
        <div>
          <h2>Queue performance</h2>
          <p>Current BullMQ delivery job counts</p>
        </div>
      </div>

      <div className="monitor-metric-grid">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            type={metric.type}
          />
        ))}
      </div>
    </section>
  );
}
