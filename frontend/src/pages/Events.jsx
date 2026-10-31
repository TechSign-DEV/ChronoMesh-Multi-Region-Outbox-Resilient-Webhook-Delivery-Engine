
import { useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Search,
  Eye,
  X,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import api from "../api";
import Sidebar from "../components/Sidebar";
import "../App.css";

const initialPayload = {
  transactionId: "TXN-1001",
  customer: "John",
  amount: 2500,
  currency: "INR",
  status: "SUCCESS",
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [webhooks, setWebhooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [eventType, setEventType] = useState("payment.completed");
  const [webhookId, setWebhookId] = useState("");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(initialPayload, null, 2)
  );

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/events");
      setEvents(response.data.events || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load events."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadWebhooks() {
    try {
      const response = await api.get("/webhooks");

      const availableWebhooks = response.data.webhooks || [];

      setWebhooks(availableWebhooks);

      const activeWebhook = availableWebhooks.find(
        (webhook) => webhook.active
      );

      if (activeWebhook) {
        setWebhookId(activeWebhook._id);
      }
    } catch (err) {
      console.error("Unable to load webhooks:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load registered webhook endpoints."
      );
    }
  }

  useEffect(() => {
    loadEvents();
    loadWebhooks();
  }, []);

  async function createEvent(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!eventType.trim()) {
      setError("Please enter an event type.");
      return;
    }

    if (!webhookId) {
      setError("Please register and select an active webhook.");
      return;
    }

    let parsedPayload;

    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setError("Invalid JSON payload. Please correct the JSON.");
      return;
    }

    if (
      parsedPayload === null ||
      typeof parsedPayload !== "object" ||
      Array.isArray(parsedPayload)
    ) {
      setError("Payload must be a valid JSON object.");
      return;
    }

    try {
      setCreating(true);

      const response = await api.post("/events", {
        eventType: eventType.trim(),
        webhookId,
        payload: parsedPayload,
      });

      setSuccess(
        response.data.message || "Event created successfully!"
      );

      setPayloadText(JSON.stringify(initialPayload, null, 2));
      setEventType("payment.completed");

      await loadEvents();

      if (response.data.event) {
        setSelectedEvent(response.data.event);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create event. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  async function viewEvent(eventId) {
    try {
      setDetailLoading(true);
      setError("");
      setSelectedEvent(null);

      const response = await api.get(`/events/${eventId}`);

      setSelectedEvent(response.data.event);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to retrieve event details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredEvents = events.filter((event) => {
    const value = search.toLowerCase();

    return (
      (event.eventId || "").toLowerCase().includes(value) ||
      (event.eventType || "").toLowerCase().includes(value) ||
      (event.status || "").toLowerCase().includes(value)
    );
  });

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">EVENT MANAGEMENT</span>
            <h1>Event Explorer</h1>
          </div>

          <button
            className="refresh-button"
            onClick={loadEvents}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <section className="welcome">
          <div>
            <span className="welcome-tag">OUTBOX INSPECTOR</span>
            <h2>Explore your event stream.</h2>
            <p>
              Create, inspect and monitor your webhook events.
            </p>
          </div>

          <Activity size={64} strokeWidth={1.2} />
        </section>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        {success && (
          <div className="success-banner">
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {/* CREATE EVENT FORM */}
        <section className="panel create-event-panel">
          <div className="panel-heading">
            <div>
              <span className="welcome-tag">OUTBOX PRODUCER</span>
              <h2>Create New Event</h2>
              <p>
                Publish an event to your ChronoMesh delivery pipeline.
              </p>
            </div>

            <Send size={30} />
          </div>

          <form onSubmit={createEvent}>
            <div className="event-form-grid">
              <div className="event-form-field">
                <label htmlFor="eventType">Event Type</label>

                <input
                  id="eventType"
                  type="text"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="payment.completed"
                  required
                />
              </div>

              <div className="event-form-field">
                <label htmlFor="webhookId">Select Webhook Endpoint</label>

                <select
                  id="webhookId"
                  value={webhookId}
                  onChange={(e) => setWebhookId(e.target.value)}
                  required
                >
                  <option value="">Select an endpoint</option>

                  {webhooks
                    .filter((webhook) => webhook.active)
                    .map((webhook) => (
                      <option
                        key={webhook._id}
                        value={webhook._id}
                      >
                        {webhook.name} — {webhook.url}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="event-form-field payload-editor">
              <label htmlFor="payload">
                Event Payload (JSON)
              </label>

              <textarea
                id="payload"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={11}
                spellCheck="false"
                required
              />
            </div>

            {webhooks.filter((webhook) => webhook.active).length === 0 && (
              <p className="event-form-hint">
                No active webhooks found. Register an endpoint first.
              </p>
            )}

            <button
              type="submit"
              className="create-event-button"
              disabled={
                creating ||
                !webhookId ||
                webhooks.filter((webhook) => webhook.active).length === 0
              }
            >
              {creating ? (
                <>
                  <RefreshCw size={17} className="spin-icon" />
                  Creating Event...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Event
                </>
              )}
            </button>
          </form>
        </section>

        {/* EVENT LIST */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>All Events</h2>
              <p>Events stored in the MongoDB outbox.</p>
            </div>

            <span className="count-badge">
              {filteredEvents.length} events
            </span>
          </div>

          <div className="event-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search event ID, type, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="empty-state">Loading events...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="empty-state">
              No matching events found.
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
                  {filteredEvents.map((event) => (
                    <tr key={event._id}>
                      <td className="event-id">
                        {event.eventId}
                      </td>

                      <td>{event.eventType}</td>

                      <td>
                        <EventStatus status={event.status} />
                      </td>

                      <td>{event.attempts ?? 0}</td>

                      <td>
                        {event.createdAt
                          ? new Date(event.createdAt).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <button
                          className="history-button"
                          onClick={() => viewEvent(event.eventId)}
                        >
                          <Eye size={15} />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {detailLoading && (
          <section className="panel">
            <p className="empty-state">
              Loading event details...
            </p>
          </section>
        )}

        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </main>
    </div>
  );
}

function EventStatus({ status }) {
  const normalized = (status || "PENDING").toUpperCase();

  return (
    <span className={`status status-${normalized.toLowerCase()}`}>
      {normalized}
    </span>
  );
}

function EventDetails({ event, onClose }) {
  return (
    <section className="panel event-details">
      <div className="panel-heading">
        <div>
          <span className="welcome-tag">EVENT DETAILS</span>
          <h2>{event.eventType}</h2>
          <p>{event.eventId}</p>
        </div>

        <button
          className="close-history"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="event-detail-grid">
        <div>
          <span>STATUS</span>
          <EventStatus status={event.status} />
        </div>

        <div>
          <span>DELIVERY ATTEMPTS</span>
          <strong>{event.attempts ?? 0}</strong>
        </div>

        <div>
          <span>CREATED AT</span>
          <strong>
            {event.createdAt
              ? new Date(event.createdAt).toLocaleString()
              : "N/A"}
          </strong>
        </div>

        <div>
          <span>DELIVERED AT</span>
          <strong>
            {event.deliveredAt
              ? new Date(event.deliveredAt).toLocaleString()
              : "Not delivered"}
          </strong>
        </div>
      </div>

      {event.lastError && (
        <div className="event-error">
          <AlertTriangle size={18} />
          <span>{event.lastError}</span>
        </div>
      )}

      <div className="payload-section">
        <h3>Event Payload</h3>
        <pre>{JSON.stringify(event.payload, null, 2)}</pre>
      </div>

      <div className="payload-section">
        <h3>Complete Event Record</h3>
        <pre>{JSON.stringify(event, null, 2)}</pre>
      </div>
    </section>
  );
}
