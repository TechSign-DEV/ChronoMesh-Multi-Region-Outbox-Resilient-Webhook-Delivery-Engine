
import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Webhook,
  AlertTriangle,
  X,
  History,
  XCircle,
} from "lucide-react";

import api from "../api";
import Sidebar from "../components/Sidebar";
import "../App.css";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [eventResponse, webhookResponse] = await Promise.all([
        api.get("/events"),
        api.get("/webhooks"),
      ]);

      setEvents(eventResponse.data.events || []);
      setWebhooks(webhookResponse.data.webhooks || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to ChronoMesh backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const delivered = events.filter(
    (event) => event.status === "DELIVERED"
  ).length;

  const failed = events.filter(
    (event) => event.status === "FAILED"
  ).length;

  const pending = events.filter(
    (event) =>
      event.status === "PENDING" ||
      event.status === "PROCESSING"
  ).length;

  return (
    <div className="app-shell">

      {/* Reusable Sidebar */}
      <Sidebar />

      <main className="main-content">

        {/* Header */}
        <header className="topbar">
          <div>
            <span className="eyebrow">
              SYSTEM CONTROL CENTER
            </span>
            <h1>Overview</h1>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {/* Welcome Section */}
        <section className="welcome">
          <div>
            <span className="welcome-tag">
              EVENT DELIVERY ENGINE
            </span>

            <h2>Webhook operations at a glance.</h2>

            <p>
              Monitor event processing and registered delivery endpoints.
            </p>
          </div>

          <Activity size={64} strokeWidth={1.2} />
        </section>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        {/* Statistics */}
        <section className="stats-grid">
          <StatCard
            label="TOTAL EVENTS"
            value={events.length}
            icon={<Activity />}
          />

          <StatCard
            label="DELIVERED"
            value={delivered}
            icon={<CheckCircle2 />}
          />

          <StatCard
            label="PENDING / PROCESSING"
            value={pending}
            icon={<Clock3 />}
          />

          <StatCard
            label="FAILED"
            value={failed}
            icon={<AlertTriangle />}
          />
        </section>

        {/* Recent Events */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Events</h2>
              <p>Latest events recorded in the outbox.</p>
            </div>

            <span className="count-badge">
              {events.length} events
            </span>
          </div>

          {loading ? (
            <p className="empty-state">
              Loading dashboard...
            </p>
          ) : events.length === 0 ? (
            <p className="empty-state">
              No events yet. Your event activity will appear here.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>EVENT ID</th>
                    <th>EVENT TYPE</th>
                    <th>STATUS</th>
                    <th>ATTEMPTS</th>
                    <th>CREATED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td className="event-id">
                        {event.eventId || event._id}
                      </td>

                      <td>{event.eventType}</td>

                      <td>
                        <span
                          className={`status status-${(
                            event.status || "pending"
                          ).toLowerCase()}`}
                        >
                          {event.status}
                        </span>
                      </td>

                      <td>{event.attempts ?? 0}</td>

                      <td>
                        {event.createdAt
                          ? new Date(
                              event.createdAt
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <button
                          className="history-button"
                          onClick={() =>
                            setSelectedEventId(event.eventId)
                          }
                          disabled={!event.eventId}
                        >
                          <History size={15} />
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Registered Endpoints */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Registered Endpoints</h2>
              <p>
                Webhook destinations configured in ChronoMesh.
              </p>
            </div>

            <span className="count-badge">
              {webhooks.length} endpoints
            </span>
          </div>

          {webhooks.length === 0 ? (
            <p className="empty-state">
              No webhook endpoints registered yet.
            </p>
          ) : (
            <div className="endpoint-list">
              {webhooks.map((webhook) => (
                <div
                  className="endpoint-row"
                  key={webhook._id || webhook.id}
                >
                  <div className="endpoint-icon">
                    <Webhook size={20} />
                  </div>

                  <div className="endpoint-info">
                    <strong>{webhook.name}</strong>
                    <span>{webhook.url}</span>
                  </div>

                  <span
                    className={`status ${
                      webhook.active
                        ? "status-delivered"
                        : "status-failed"
                    }`}
                  >
                    {webhook.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Delivery History */}
        {selectedEventId && (
          <DeliveryHistory
            eventId={selectedEventId}
            onClose={() => setSelectedEventId("")}
          />
        )}

      </main>
    </div>
  );
}

// Delivery History Component
function DeliveryHistory({ eventId, onClose }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAttempts() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/deliveries/${eventId}`
        );

        if (!cancelled) {
          setAttempts(response.data.attempts || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load delivery history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAttempts();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <section className="panel delivery-history">
      <div className="panel-heading">
        <div>
          <h2>Delivery History</h2>
          <p>Event ID: {eventId}</p>
        </div>

        <button
          className="close-history"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <p className="empty-state">
          Loading delivery attempts...
        </p>
      ) : error ? (
        <p className="error-banner">{error}</p>
      ) : attempts.length === 0 ? (
        <p className="empty-state">
          No delivery attempts recorded for this event.
        </p>
      ) : (
        <div className="attempt-list">
          {attempts.map((attempt) => (
            <div
              className="attempt-card"
              key={attempt._id}
            >
              <div className="attempt-heading">
                {attempt.status === "SUCCESS" ? (
                  <CheckCircle2
                    color="#22c55e"
                    size={19}
                  />
                ) : attempt.status === "FAILED" ? (
                  <XCircle
                    color="#ef4444"
                    size={19}
                  />
                ) : (
                  <Clock3
                    color="#eab308"
                    size={19}
                  />
                )}

                <strong>
                  Attempt #{attempt.attemptNumber}
                </strong>

                <span
                  className={`status status-${(
                    attempt.status || "processing"
                  ).toLowerCase()}`}
                >
                  {attempt.status}
                </span>
              </div>

              <div className="attempt-metadata">
                <span>
                  HTTP Status: {attempt.httpStatus ?? "N/A"}
                </span>

                <span>
                  Duration: {attempt.durationMs ?? "N/A"} ms
                </span>

                <span>
                  Started:{" "}
                  {attempt.startedAt
                    ? new Date(
                        attempt.startedAt
                      ).toLocaleString()
                    : "N/A"}
                </span>
              </div>

              {attempt.error && (
                <p className="attempt-error">
                  {attempt.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Statistics Card Component
function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>

        <div className="stat-icon">
          {icon}
        </div>
      </div>

      <strong>{value}</strong>
    </div>
  );
}
