
import { useEffect, useState } from "react";
import api from "../api";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

function DeliveryHistory({ eventId }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAttempts = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/deliveries/${eventId}`);

      setAttempts(response.data.attempts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load delivery history"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [eventId]);

  const getStatusIcon = (status) => {
    if (status === "SUCCESS") {
      return <CheckCircle size={18} color="#22c55e" />;
    }

    if (status === "FAILED") {
      return <XCircle size={18} color="#ef4444" />;
    }

    return <Clock size={18} color="#eab308" />;
  };

  if (!eventId) {
    return <p>Select an event to view its delivery history.</p>;
  }

  return (
    <section className="delivery-history">
      <div className="delivery-history-header">
        <div>
          <h2>Delivery History</h2>
          <p>Event ID: {eventId}</p>
        </div>

        <button onClick={loadAttempts} disabled={loading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading && <p>Loading delivery attempts...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && attempts.length === 0 && (
        <p>No delivery attempts recorded yet.</p>
      )}

      {attempts.map((attempt) => (
        <article
          className="delivery-attempt"
          key={attempt._id}
        >
          <div className="attempt-status">
            {getStatusIcon(attempt.status)}
            <strong>{attempt.status}</strong>
          </div>

          <div className="attempt-details">
            <span>Attempt #{attempt.attemptNumber}</span>
            <span>HTTP: {attempt.httpStatus ?? "N/A"}</span>
            <span>Duration: {attempt.durationMs ?? "N/A"} ms</span>
            <span>
              Started:{" "}
              {attempt.startedAt
                ? new Date(attempt.startedAt).toLocaleString()
                : "N/A"}
            </span>
          </div>

          {attempt.error && (
            <p className="attempt-error">{attempt.error}</p>
          )}
        </article>
      ))}
    </section>
  );
}

export default DeliveryHistory;
