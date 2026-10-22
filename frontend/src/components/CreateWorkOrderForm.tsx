import { useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../services/api";

interface CreateWorkOrderFormProps {
  onCreated: () => void;
  onClose: () => void;
}

function CreateWorkOrderForm({
  onCreated,
  onClose,
}: CreateWorkOrderFormProps) {
  const userRole = (
    localStorage.getItem("userRole") || ""
  ).toUpperCase();

  const canCreateWorkOrder =
    userRole === "MANAGER" ||
    userRole === "DISPATCHER";

  const [customerId, setCustomerId] = useState("1");
  const [siteId, setSiteId] = useState("1");
  const [assignedTo, setAssignedTo] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [slaDueAt, setSlaDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!canCreateWorkOrder) {
      setError(
        "Your role does not have permission to create work orders."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await apiFetch("/api/work-orders", {
        method: "POST",
        body: JSON.stringify({
          customerId: Number(customerId),
          siteId: Number(siteId),
          assignedTo: assignedTo
            ? Number(assignedTo)
            : null,
          code,
          title,
          priority,
          status: "NEW",
          slaDueAt: slaDueAt
            ? new Date(slaDueAt).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Your account does not have permission to create work orders."
          );
        }

        if (response.status === 409) {
          throw new Error(
            "This work order code may already exist. Please use a unique code."
          );
        }

        throw new Error(
          `Could not create the work order (HTTP ${response.status}).`
        );
      }

      setCode("");
      setTitle("");
      setAssignedTo("");
      setSlaDueAt("");

      onCreated();
      onClose();
    } catch (err) {
      console.error("Create Work Order error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not create the work order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>Create Work Order</h2>
            <p>Add a new maintenance request.</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {!canCreateWorkOrder ? (
          <>
            <div className="error-message">
              Your account has the {userRole || "unknown"} role.
              Only Managers and Dispatchers can create staff work
              orders. Technicians can work on assigned jobs, and
              customers can submit requests through the customer
              portal.
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer ID</label>
                  <input
                    type="number"
                    min="1"
                    value={customerId}
                    onChange={(e) =>
                      setCustomerId(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Site ID</label>
                  <input
                    type="number"
                    min="1"
                    value={siteId}
                    onChange={(e) =>
                      setSiteId(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Technician ID</label>
                  <input
                    type="number"
                    min="1"
                    value={assignedTo}
                    onChange={(e) =>
                      setAssignedTo(e.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value)
                    }
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Work Order Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value)
                    }
                    placeholder="WO-006"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SLA Due</label>
                  <input
                    type="datetime-local"
                    value={slaDueAt}
                    onChange={(e) =>
                      setSlaDueAt(e.target.value)
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="Describe the maintenance issue"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onClose}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Creating..."
                    : "Create Work Order"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default CreateWorkOrderForm;