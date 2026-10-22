import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../services/api";

interface CustomerSite {
  id: number;
  name?: string;
  siteName?: string;
  code?: string;
  address?: string;
  location?: string;
}

interface CustomerWorkOrder {
  id?: number;
  workOrderId?: number;
  code?: string;
  title?: string;
  description?: string | null;
  priority?: string;
  status?: string;
  siteId?: number;
  siteName?: string;
  slaDueAt?: string | null;
  createdAt?: string | null;
}

interface StatusHistory {
  id?: number;
  fromStatus?: string | null;
  toStatus?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  status?: string | null;
  changedAt?: string | null;
  timestamp?: string | null;
  createdAt?: string | null;
}

function getOrderId(order: CustomerWorkOrder): number | null {
  const id = order.id ?? order.workOrderId;
  return typeof id === "number" ? id : null;
}

function getSiteLabel(site: CustomerSite): string {
  return (
    site.name ||
    site.siteName ||
    site.address ||
    site.location ||
    site.code ||
    `Site #${site.id}`
  );
}

function getFriendlyError(
  status: number,
  fallback: string
): string {
  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "This account is not authorized for the customer portal, or it is not linked to a customer record.";
  }

  if (status === 404) {
    return "The requested record could not be found.";
  }

  if (status === 400) {
    return "Please check the request details and try again.";
  }

  return fallback;
}

function CustomerPortal() {
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [orders, setOrders] = useState<CustomerWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [historyOrderId, setHistoryOrderId] =
    useState<number | null>(null);

  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadPortal = async () => {
    try {
      setLoading(true);
      setError("");

      const [siteResponse, orderResponse] = await Promise.all([
        apiFetch("/api/customer-portal/sites"),
        apiFetch("/api/customer-portal/work-orders"),
      ]);

      if (!siteResponse.ok) {
        throw new Error(
          getFriendlyError(
            siteResponse.status,
            "Unable to load your sites."
          )
        );
      }

      if (!orderResponse.ok) {
        throw new Error(
          getFriendlyError(
            orderResponse.status,
            "Unable to load your requests."
          )
        );
      }

      const siteData: CustomerSite[] = await siteResponse.json();
      const orderData: CustomerWorkOrder[] = await orderResponse.json();

      setSites(siteData);
      setOrders(orderData);
    } catch (err) {
      console.error("Customer portal loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the customer portal."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, []);

  const createRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!siteId) {
      setError("Please select one of your sites.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and describe the issue.");
      return;
    }

    if (title.trim().length > 200) {
      setError("The request title cannot exceed 200 characters.");
      return;
    }

    if (description.trim().length > 5000) {
      setError("The description cannot exceed 5000 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch("/api/customer-portal/requests", {
        method: "POST",
        body: JSON.stringify({
          siteId: Number(siteId),
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          getFriendlyError(
            response.status,
            "Unable to submit your maintenance request."
          )
        );
      }

      const created: CustomerWorkOrder = await response.json();

      setTitle("");
      setDescription("");
      setSiteId("");

      setSuccess(
        `Your maintenance request${created.code ? ` ${created.code}` : ""} was submitted successfully.`
      );

      // Refresh from the server so the list remains authoritative.
      await loadPortal();
    } catch (err) {
      console.error("Customer request error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your request."
      );
    } finally {
      setSaving(false);
    }
  };

  const viewHistory = async (workOrderId: number) => {
    if (historyOrderId === workOrderId) {
      setHistoryOrderId(null);
      setHistory([]);
      setHistoryError("");
      return;
    }

    try {
      setHistoryOrderId(workOrderId);
      setHistory([]);
      setHistoryError("");
      setLoadingHistory(true);

      const response = await apiFetch(
        `/api/customer-portal/work-orders/${workOrderId}/history`
      );

      if (!response.ok) {
        throw new Error(
          getFriendlyError(
            response.status,
            "Unable to load request history."
          )
        );
      }

      const data: StatusHistory[] = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Request history error:", err);
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Unable to load request history."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Not available";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Not available"
      : date.toLocaleString();
  };

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Customer Portal</h1>
          <p>Raise maintenance requests and track their progress.</p>
        </div>

        <button
          type="button"
          className="action-button"
          onClick={() => void loadPortal()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "10px",
            background: "#e8f7ee",
            color: "#17663a",
          }}
        >
          {success}
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Raise a Maintenance Request</h2>
            <p>Tell us which site needs attention and what happened.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading your sites...</p>
        ) : sites.length === 0 ? (
          <p>
            No sites are linked to this account yet. Please contact your
            facilities manager to link your customer account to a site.
          </p>
        ) : (
          <form onSubmit={createRequest}>
            <div className="form-group">
              <label htmlFor="customer-site">Your site</label>
              <select
                id="customer-site"
                value={siteId}
                onChange={(event) => setSiteId(event.target.value)}
                disabled={saving}
                required
              >
                <option value="">Select your site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {getSiteLabel(site)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="request-title">Request title</label>
              <input
                id="request-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="For example, Air conditioner not cooling"
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="request-description">
                Describe the issue
              </label>
              <textarea
                id="request-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="Tell us what needs repair or inspection..."
                disabled={saving}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={saving}
            >
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </section>

      <section className="panel" style={{ marginTop: "24px" }}>
        <div className="panel-header">
          <div>
            <h2>My Maintenance Requests</h2>
            <p>Only requests linked to your customer account are shown.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading your requests...</p>
        ) : orders.length === 0 ? (
          <p>You have no maintenance requests yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {orders.map((order, index) => {
              const id = getOrderId(order);
              const site = sites.find(
                (item) => item.id === order.siteId
              );

              return (
                <article
                  key={id ?? order.code ?? index}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <strong>{order.code || `Request #${id ?? "—"}`}</strong>
                      <h3 style={{ margin: "8px 0" }}>
                        {order.title || "Maintenance request"}
                      </h3>
                      {order.description && <p>{order.description}</p>}
                    </div>

                    <span className="status">
                      {order.status || "Status unavailable"}
                    </span>
                  </div>

                  <p>
                    <strong>Site:</strong>{" "}
                    {site
                      ? getSiteLabel(site)
                      : order.siteName ||
                        (order.siteId
                          ? `Site #${order.siteId}`
                          : "Kanpur Plant")}
                  </p>

                  <p>
                    <strong>Priority:</strong>{" "}
                    {order.priority || "Not available"}
                  </p>

                  <p>
                    <strong>SLA due:</strong>{" "}
                    {formatDate(order.slaDueAt)}
                  </p>

                  {id !== null && (
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => void viewHistory(id)}
                    >
                      {historyOrderId === id
                        ? "Hide History"
                        : "View Status History"}
                    </button>
                  )}

                  {id !== null && historyOrderId === id && (
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "14px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <h4>Status History</h4>

                      {loadingHistory ? (
                        <p>Loading history...</p>
                      ) : historyError ? (
                        <p role="alert">{historyError}</p>
                      ) : history.length === 0 ? (
                        <p>No status history is available yet.</p>
                      ) : (
                        <ol style={{ paddingLeft: "22px" }}>
                          {history.map((entry, historyIndex) => (
                            <li
                              key={entry.id ?? historyIndex}
                              style={{ marginBottom: "10px" }}
                            >
                              <strong>
                                {entry.fromStatus ??
                                  entry.previousStatus ??
                                  "Created"}
                                {" → "}
                                {entry.toStatus ??
                                  entry.newStatus ??
                                  entry.status ??
                                  "Updated"}
                              </strong>
                              <div style={{ color: "#64748b" }}>
                                {formatDate(
                                  entry.changedAt ??
                                    entry.timestamp ??
                                    entry.createdAt
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerPortal;
