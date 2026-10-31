
import { Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";

const icons = {
  waiting: Clock,
  active: Activity,
  completed: CheckCircle,
  failed: AlertCircle,
};

export default function MetricCard({ label, value, type }) {
  const Icon = icons[type] || Activity;

  return (
    <div className="monitor-metric-card">
      <div className="monitor-metric-top">
        <span>{label}</span>
        <Icon size={20} />
      </div>

      <div className="monitor-metric-value">
        {Number(value || 0).toLocaleString()}
      </div>
    </div>
  );
}
