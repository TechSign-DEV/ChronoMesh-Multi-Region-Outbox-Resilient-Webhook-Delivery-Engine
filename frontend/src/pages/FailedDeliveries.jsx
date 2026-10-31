
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Clock3,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../api";
import Sidebar from "../components/Sidebar";
import "../App.css";

export default function FailedDeliveries() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryingId, setRetryingId] = useState("");

  async function loadFailedEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/events");

      const failedEvents = (response.data.events || []).filter(
        (event) => event.status === "FAILED"
      );

      setEvents(failedEvents);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load failed deliveries."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFailedEvents();
  }, []);

  async function handleRetry(eventId) {
    try {
      setRetryingId(eventId);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/deliveries/${eventId}/retry`
      );

      setSuccess(
        response.data.message || "Retry queued successfully."
      );

      await loadFailedEvents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to retry this delivery."
      );
    } finally {
      setRetryingId("");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">DELIVERY MONITORING</span>
            <h1>Failed Deliveries</h1>
          </div>

          <button
            className="refresh-button"
            onClick={loadFailedEvents}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <section className="welcome">
          <div>
            <span className="welcome-tag">FAILURE MANAGEMENT</span>
            <h2>Monitor and recover failed events.</h2>
            <p>
              Review delivery failures and manually enqueue another attempt.
            </p>
          </div>

          <AlertTriangle size={64} strokeWidth={1.2} />
        </section>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        {success && (
          <div className="success-banner">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>FAILED EVENTS</span>
              <div className="stat-icon">
                <XCircle />
              </div>
            </div>
            <strong>{events.length}</strong>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>RETRY AVAILABLE</span>
              <div className="stat-icon">
                <RotateCcw />
              </div>
            </div>
            <strong>{events.length}</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Failed Event Queue</h2>
              <p>
                Events that exhausted their automatic delivery attempts.
              </p>
            </div>

            <span className="count-badge">
              {events.length} failed
            </span>
          </div>

          {loading ? (
            <p className="empty-state">
              Loading failed events...
            </p>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={30} />
              <p>No failed deliveries. Everything is clear!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>EVENT ID</th>
                    <th>EVENT TYPE</th>
                    <th>ATTEMPTS</th>
                    <th>LAST ERROR</th>
                    <th>CREATED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td className="event-id">
                        {event.eventId}
                      </td>

                      <td>{event.eventType}</td>

                      <td>{event.attempts ?? 0}</td>

                      <td className="failed-error-cell">
                        {event.lastError || "No error details"}
                      </td>

                      <td>
                        {event.createdAt
                          ? new Date(
                              event.createdAt
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <button
                          className="retry-button"
                          onClick={() => handleRetry(event.eventId)}
                          disabled={retryingId === event.eventId}
                        >
                          <RotateCcw size={15} />
                          {retryingId === event.eventId
                            ? "Queuing..."
                            : "Retry"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel retry-information">
          <div className="panel-heading">
            <div>
              <h2>Retry Strategy</h2>
              <p>How ChronoMesh handles manual retries.</p>
            </div>
            <Clock3 size={22} />
          </div>

          <ul>
            <li>Manual retry creates a new BullMQ job.</li>
            <li>Each new job receives up to five delivery attempts.</li>
            <li>Automatic retries use exponential backoff.</li>
            <li>Delivery attempt records remain available for auditing.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
