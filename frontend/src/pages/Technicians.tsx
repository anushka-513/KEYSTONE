
import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

interface WorkOrder {
  id: number;
  customerId: number;
  siteId: number;
  assignedTo: number | null;
  code: string;
  title: string;
  priority: string;
  status: string;
  slaDueAt: string | null;
}

interface TimeLog {
  id: number;
  workOrderId: number;
  technicianId: number;
  minutes: number;
  note: string | null;
}

interface Part {
  id: number;
  name: string;
  sku: string;
  stockQty: number;
  unitCost: number;
}

interface PartUsage {
  id: number;
  workOrderId: number;
  partId: number;
  qtyUsed: number;
}

interface StatusAction {
  label: string;
  status: string;
}

function getUserIdFromToken(): number | null {
  const token = localStorage.getItem("token");

  if (!token) return null;

  try {
    const payload = token.split(".")[1];

    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = atob(
      base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "="
      )
    );

    const claims = JSON.parse(decoded);
    const id = Number(claims.userId);

    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusActions(status: string): StatusAction[] {
  switch (status) {
    case "ASSIGNED":
      return [{ label: "Start Job", status: "IN_PROGRESS" }];

    case "IN_PROGRESS":
      return [
        { label: "Put On Hold", status: "ON_HOLD" },
        { label: "Complete", status: "COMPLETED" },
      ];

    case "ON_HOLD":
      return [{ label: "Resume Job", status: "IN_PROGRESS" }];

    default:
      // Technicians cannot close jobs.
      return [];
  }
}

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (response.status === 403) {
    return "You are not authorized to perform this action.";
  }

  if (response.status === 409) {
    return "The operation conflicts with the current work order status or available stock.";
  }

  try {
    const body = await response.json();

    return body.message || body.detail || fallback;
  } catch {
    return fallback;
  }
}

function Technicians() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [timeLogWorkOrderId, setTimeLogWorkOrderId] =
    useState<number | null>(null);

  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [savingTimeLog, setSavingTimeLog] = useState(false);

  const [timeLogs, setTimeLogs] =
    useState<Record<number, TimeLog[]>>({});

  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);
  const [partsError, setPartsError] = useState("");

  const [partUsages, setPartUsages] =
    useState<Record<number, PartUsage[]>>({});

  const [partUsageWorkOrderId, setPartUsageWorkOrderId] =
    useState<number | null>(null);

  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQuantity, setPartQuantity] = useState("");
  const [savingPartUsage, setSavingPartUsage] = useState(false);

  const technicianName =
    localStorage.getItem("userName") || "Technician";

  const loadTimeLogs = async (workOrderId: number) => {
    try {
      const response = await apiFetch(
        `/api/time-logs/work-order/${workOrderId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load time logs.");
      }

      const data: TimeLog[] = await response.json();

      setTimeLogs((current) => ({
        ...current,
        [workOrderId]: data,
      }));
    } catch (err) {
      console.error("Time logs:", err);
    }
  };

  const loadPartUsages = async (workOrderId: number) => {
    try {
      const response = await apiFetch(
        `/api/part-usage/work-order/${workOrderId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load parts usage.");
      }

      const data: PartUsage[] = await response.json();

      setPartUsages((current) => ({
        ...current,
        [workOrderId]: data,
      }));
    } catch (err) {
      console.error("Parts usage:", err);
    }
  };

  const loadParts = async () => {
    try {
      setLoadingParts(true);
      setPartsError("");

      const response = await apiFetch("/api/parts");

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to load inventory parts."
          )
        );
      }

      const data: Part[] = await response.json();
      setParts(data);
    } catch (err) {
      console.error(err);
      setPartsError(
        err instanceof Error
          ? err.message
          : "Unable to load inventory parts."
      );
    } finally {
      setLoadingParts(false);
    }
  };

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/work-orders");

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to load work orders."
          )
        );
      }

      const data: WorkOrder[] = await response.json();
      const role = localStorage.getItem("userRole");
      const userId = getUserIdFromToken();

      // The backend is the actual security boundary.
      // This filter only controls what the page displays.
      const assignedJobs =
        role === "TECHNICIAN" && userId !== null
          ? data.filter((order) => order.assignedTo === userId)
          : data.filter((order) => order.assignedTo !== null);

      setWorkOrders(assignedJobs);

      await Promise.all(
        assignedJobs.map(async (order) => {
          await Promise.all([
            loadTimeLogs(order.id),
            loadPartUsages(order.id),
          ]);
        })
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load technician jobs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkOrders();
    void loadParts();
  }, []);

  const updateStatus = async (
    workOrderId: number,
    newStatus: string
  ) => {
    try {
      setUpdatingId(workOrderId);
      setError("");

      const response = await apiFetch(
        `/api/work-orders/${workOrderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Could not update work order status."
          )
        );
      }

      const updatedOrder: WorkOrder = await response.json();

      setWorkOrders((current) =>
        current.map((order) =>
          order.id === workOrderId ? updatedOrder : order
        )
      );

      // Refresh the displayed list from the backend.
      await loadWorkOrders();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not update work order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const saveTimeLog = async () => {
    if (timeLogWorkOrderId === null) return;

    const enteredMinutes = Number(minutes);

    if (!minutes || !Number.isInteger(enteredMinutes) || enteredMinutes <= 0) {
      setError("Enter a valid number of minutes greater than zero.");
      return;
    }

    try {
      setSavingTimeLog(true);
      setError("");

      const response = await apiFetch("/api/time-logs", {
        method: "POST",
        body: JSON.stringify({
          workOrderId: timeLogWorkOrderId,
          minutes: enteredMinutes,
          note: note.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Could not save the time log."
          )
        );
      }

      const savedWorkOrderId = timeLogWorkOrderId;

      setMinutes("");
      setNote("");
      setTimeLogWorkOrderId(null);

      await loadTimeLogs(savedWorkOrderId);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not save the time log."
      );
    } finally {
      setSavingTimeLog(false);
    }
  };

  const openPartUsage = (workOrderId: number) => {
    setPartUsageWorkOrderId(workOrderId);
    setSelectedPartId("");
    setPartQuantity("");
    setPartsError("");
  };

  const savePartUsage = async () => {
    if (partUsageWorkOrderId === null) return;

    const partId = Number(selectedPartId);
    const quantity = Number(partQuantity);

    if (!selectedPartId || !Number.isInteger(partId) || partId <= 0) {
      setPartsError("Please select an inventory part.");
      return;
    }

    if (!partQuantity || !Number.isInteger(quantity) || quantity <= 0) {
      setPartsError("Quantity must be a positive whole number.");
      return;
    }

    const selectedPart = parts.find((part) => part.id === partId);

    if (!selectedPart) {
      setPartsError("The selected part could not be found.");
      return;
    }

    if (quantity > selectedPart.stockQty) {
      setPartsError(
        `Only ${selectedPart.stockQty} unit(s) of ${selectedPart.name} are available.`
      );
      return;
    }

    try {
      setSavingPartUsage(true);
      setPartsError("");

      const response = await apiFetch("/api/part-usage", {
        method: "POST",
        body: JSON.stringify({
          workOrderId: partUsageWorkOrderId,
          partId,
          qtyUsed: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Could not record parts usage."
          )
        );
      }

      const savedWorkOrderId = partUsageWorkOrderId;

      setPartUsageWorkOrderId(null);
      setSelectedPartId("");
      setPartQuantity("");

      // Refresh stock and the work order's parts history.
      await Promise.all([
        loadParts(),
        loadPartUsages(savedWorkOrderId),
      ]);
    } catch (err) {
      console.error(err);

      setPartsError(
        err instanceof Error
          ? err.message
          : "Could not record parts usage."
      );
    } finally {
      setSavingPartUsage(false);
    }
  };

  const getTotalMinutes = (workOrderId: number) => {
    return (timeLogs[workOrderId] || []).reduce(
      (total, log) => total + log.minutes,
      0
    );
  };

  const formatHours = (totalMinutes: number) => {
    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return remainingMinutes === 0
      ? `${hours} hr`
      : `${hours} hr ${remainingMinutes} min`;
  };

  const getPartName = (partId: number) => {
    const part = parts.find((item) => item.id === partId);

    return part ? `${part.name} (${part.sku})` : `Part #${partId}`;
  };

  const modalWorkOrder =
    workOrders.find(
      (order) => order.id === partUsageWorkOrderId
    ) || null;

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Technician View</h1>
          <p>Your assigned maintenance jobs</p>
        </div>

        <div className="technician-profile">
          <div className="avatar">{getInitials(technicianName)}</div>
          <span>{technicianName}</span>
        </div>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>My Assigned Jobs</h2>
            <p>Track progress, time and parts used on your work orders.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading assigned jobs...</p>
        ) : workOrders.length === 0 ? (
          <p>No jobs are currently assigned.</p>
        ) : (
          <div className="technician-table">
            <div className="technician-row technician-header">
              <span>Work Order</span>
              <span>Issue</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Time</span>
              <span>Actions</span>
            </div>

            {workOrders.map((workOrder) => {
              const actions = getStatusActions(workOrder.status);
              const totalMinutes = getTotalMinutes(workOrder.id);
              const logs = timeLogs[workOrder.id] || [];
              const usages = partUsages[workOrder.id] || [];

              const canLogWork =
                workOrder.status === "IN_PROGRESS" ||
                workOrder.status === "ON_HOLD";

              return (
                <div key={workOrder.id}>
                  <div className="technician-row">
                    <strong>{workOrder.code}</strong>

                    <span>{workOrder.title}</span>

                    <span className="priority">
                      {workOrder.priority}
                    </span>

                    <span className="status">
                      {workOrder.status}
                    </span>

                    <span>
                      {totalMinutes > 0
                        ? formatHours(totalMinutes)
                        : "No time logged"}
                    </span>

                    <span className="technician-actions">
                      {actions.map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          className="action-button"
                          disabled={updatingId === workOrder.id}
                          onClick={() =>
                            updateStatus(workOrder.id, action.status)
                          }
                        >
                          {updatingId === workOrder.id
                            ? "Updating..."
                            : action.label}
                        </button>
                      ))}

                      {canLogWork && (
                        <>
                          <button
                            type="button"
                            className="time-button"
                            onClick={() =>
                              setTimeLogWorkOrderId(workOrder.id)
                            }
                          >
                            Log Time
                          </button>

                          <button
                            type="button"
                            className="action-button"
                            onClick={() => openPartUsage(workOrder.id)}
                          >
                            Log Parts
                          </button>
                        </>
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#fafbfc",
                    }}
                  >
                    <strong>Parts used</strong>

                    {usages.length === 0 ? (
                      <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                        No parts recorded for this job yet.
                      </p>
                    ) : (
                      <ul style={{ margin: "8px 0", paddingLeft: "22px" }}>
                        {usages.map((usage) => (
                          <li key={usage.id}>
                            {getPartName(usage.partId)} — {usage.qtyUsed}{" "}
                            unit(s)
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={{ marginTop: "10px" }}>
                      <strong>Time log history</strong>

                      {logs.length === 0 ? (
                        <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                          No time recorded yet.
                        </p>
                      ) : (
                        <ul style={{ margin: "8px 0", paddingLeft: "22px" }}>
                          {logs.map((log) => (
                            <li key={log.id}>
                              {formatHours(log.minutes)}
                              {log.note ? ` — ${log.note}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {timeLogWorkOrderId !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Log Time</h2>
                <p>Record time spent working on this job.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setTimeLogWorkOrderId(null)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="time-minutes">Minutes</label>

              <input
                id="time-minutes"
                type="number"
                min="1"
                step="1"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                placeholder="120"
              />
            </div>

            <div className="form-group">
              <label htmlFor="time-note">Note</label>

              <textarea
                id="time-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Describe the work performed..."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                disabled={savingTimeLog}
                onClick={() => setTimeLogWorkOrderId(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="submit-button"
                disabled={savingTimeLog}
                onClick={saveTimeLog}
              >
                {savingTimeLog ? "Saving..." : "Save Time Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      {partUsageWorkOrderId !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Record Parts Used</h2>
                <p>
                  {modalWorkOrder
                    ? `${modalWorkOrder.code} — ${modalWorkOrder.title}`
                    : "Record inventory used on this job."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                disabled={savingPartUsage}
                onClick={() => setPartUsageWorkOrderId(null)}
              >
                ×
              </button>
            </div>

            {partsError && (
              <div className="error-message" role="alert">
                {partsError}
              </div>
            )}

            {loadingParts ? (
              <p>Loading available parts...</p>
            ) : parts.length === 0 ? (
              <p>No inventory parts are currently available.</p>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="part-select">Inventory part</label>

                  <select
                    id="part-select"
                    value={selectedPartId}
                    disabled={savingPartUsage}
                    onChange={(event) =>
                      setSelectedPartId(event.target.value)
                    }
                  >
                    <option value="">Select a part</option>

                    {parts.map((part) => (
                      <option
                        key={part.id}
                        value={part.id}
                        disabled={part.stockQty <= 0}
                      >
                        {part.name} — {part.sku} (Stock: {part.stockQty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="part-quantity">Quantity used</label>

                  <input
                    id="part-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={partQuantity}
                    disabled={savingPartUsage}
                    onChange={(event) =>
                      setPartQuantity(event.target.value)
                    }
                    placeholder="Enter quantity"
                  />
                </div>

                {selectedPartId && (
                  <p>
                    Available stock:{" "}
                    {parts.find(
                      (part) => part.id === Number(selectedPartId)
                    )?.stockQty ?? 0}{" "}
                    unit(s)
                  </p>
                )}
              </>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                disabled={savingPartUsage}
                onClick={() => setPartUsageWorkOrderId(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="submit-button"
                disabled={
                  savingPartUsage ||
                  loadingParts ||
                  parts.length === 0
                }
                onClick={savePartUsage}
              >
                {savingPartUsage ? "Saving..." : "Save Parts Usage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Technicians;
