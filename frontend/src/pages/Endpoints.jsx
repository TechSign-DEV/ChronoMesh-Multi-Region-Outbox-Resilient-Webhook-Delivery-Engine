
import { useEffect, useState } from "react";
import {
  Webhook,
  Plus,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../api";
import "../App.css";

export default function Endpoints() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const [form, setForm] = useState({
    name: "",
    url: "",
  });

  async function loadWebhooks() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/webhooks");

      setWebhooks(response.data.webhooks || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load webhook endpoints."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWebhooks();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");
    setNewSecret("");

    try {
      const response = await api.post("/webhooks", form);

      const createdWebhook =
        response.data.webhook || response.data;

      if (createdWebhook.secret) {
        setNewSecret(createdWebhook.secret);
      }

      setSuccess("Webhook endpoint registered successfully.");

      setForm({
        name: "",
        url: "",
      });

      await loadWebhooks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to register webhook endpoint."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(newSecret);
      setSuccess("Webhook secret copied successfully.");
    } catch {
      setError("Unable to copy secret. Please copy it manually.");
    }
  }

  return (
    <main className="main-content">
      <header className="topbar">
        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Webhook Endpoints</h1>
        </div>

        <button
          className="refresh-button"
          onClick={loadWebhooks}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="welcome">
        <div>
          <span className="welcome-tag">ENDPOINT MANAGEMENT</span>
          <h2>Manage webhook destinations.</h2>
          <p>
            Register endpoints that receive signed ChronoMesh events.
          </p>
        </div>

        <Webhook size={64} strokeWidth={1.2} />
      </section>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="success-banner">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Register Endpoint</h2>
            <p>Add a new webhook destination.</p>
          </div>

          <Plus size={22} />
        </div>

        <form className="endpoint-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Endpoint Name</label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Example: Payment Service"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">Webhook URL</label>

            <input
              id="url"
              name="url"
              type="url"
              placeholder="http://localhost:5000/api/test-receiver"
              value={form.url}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            <Plus size={17} />
            {submitting ? "Registering..." : "Register Endpoint"}
          </button>
        </form>
      </section>

      {newSecret && (
        <section className="panel secret-panel">
          <h2>Webhook Secret</h2>

          <p>
            Save this secret securely. It is displayed only once during
            registration.
          </p>

          <div className="secret-display">
            <code>
              {showSecret
                ? newSecret
                : "•".repeat(Math.min(newSecret.length, 32))}
            </code>

            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              title={showSecret ? "Hide secret" : "Show secret"}
            >
              {showSecret ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>

            <button
              type="button"
              onClick={copySecret}
              title="Copy secret"
            >
              <Copy size={18} />
            </button>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Registered Endpoints</h2>
            <p>All configured webhook destinations.</p>
          </div>

          <span className="count-badge">
            {webhooks.length} endpoints
          </span>
        </div>

        {loading ? (
          <p className="empty-state">Loading endpoints...</p>
        ) : webhooks.length === 0 ? (
          <p className="empty-state">
            No endpoints registered yet.
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
    </main>
  );
}
