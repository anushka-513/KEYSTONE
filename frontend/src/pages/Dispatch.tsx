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

interface Technician {
  id: number;
  name: string;
  email: string;
}

function Dispatch() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<
    Record<number, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    void loadWorkOrders();
    void loadTechnicians();
  }, []);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/work-orders");

      if (!response.ok) {
        throw new Error("Failed to load work orders");
      }

      const data: WorkOrder[] = await response.json();
      setWorkOrders(data);
    } catch (err) {
      console.error("Could not load work orders:", err);
      setError("Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await apiFetch("/api/users/technicians");

      if (!response.ok) {
        throw new Error("Failed to load technicians");
      }

      const data: Technician[] = await response.json();
      setTechnicians(data);
    } catch (err) {
      console.error("Could not load technicians:", err);
      setError("Unable to load technicians. Please refresh the page.");
    }
  };

  const assignTechnician = async (
    workOrderId: number,
    technicianId: number
  ) => {
    try {
      setAssigningId(workOrderId);
      setError("");

      const response = await apiFetch(
        `/api/work-orders/${workOrderId}/assign`,
        {
          method: "PATCH",
          body: JSON.stringify({ assignedTo: technicianId }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            "This work order can no longer be assigned or reassigned. Refresh the page to see its latest status."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Your account does not have permission to assign technicians."
          );
        }

        const message = await response.text();
        throw new Error(
          message || `Assignment failed (HTTP ${response.status}).`
        );
      }

      const updatedWorkOrder: WorkOrder = await response.json();

      setWorkOrders((currentWorkOrders) =>
        currentWorkOrders.map((workOrder) =>
          workOrder.id === workOrderId ? updatedWorkOrder : workOrder
        )
      );

      setSelectedTechnicians((current) => {
        const next = { ...current };
        delete next[workOrderId];
        return next;
      });
    } catch (err) {
      console.error("Could not assign technician:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not assign the technician."
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Dispatch</h1>
          <p>Assign technicians and manage job dispatch</p>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Work Order Dispatch</h2>
            <p>Assign technicians to maintenance jobs.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading work orders...</p>
        ) : workOrders.length === 0 ? (
          <p>No work orders available.</p>
        ) : (
          <div className="dispatch-table">
            <div className="dispatch-row dispatch-header">
              <span>Work Order</span>
              <span>Issue</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Technician</span>
              <span>Action</span>
            </div>

            {workOrders.map((workOrder) => {
              const status = workOrder.status.toUpperCase();

              const isUnavailable = [
                "IN_PROGRESS",
                "ON_HOLD",
                "COMPLETED",
                "CLOSED",
                "CANCELLED",
              ].includes(status);

              const selectedTechnicianId =
                selectedTechnicians[workOrder.id] ??
                workOrder.assignedTo;

              const hasChanged =
                selectedTechnicians[workOrder.id] !== undefined &&
                selectedTechnicians[workOrder.id] !==
                  workOrder.assignedTo;

              const isAssigning = assigningId === workOrder.id;

              const canSubmit =
                !isUnavailable &&
                !isAssigning &&
                technicians.length > 0 &&
                selectedTechnicianId != null &&
                (workOrder.assignedTo == null || hasChanged);

              return (
                <div className="dispatch-row" key={workOrder.id}>
                  <strong>{workOrder.code}</strong>

                  <span>{workOrder.title}</span>

                  <span className="priority">{workOrder.priority}</span>

                  <span className="status">{workOrder.status}</span>

                  <div>
                    <select
                      value={selectedTechnicianId ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;

                        setSelectedTechnicians((current) => {
                          const next = { ...current };

                          if (value === "") {
                            delete next[workOrder.id];
                          } else {
                            next[workOrder.id] = Number(value);
                          }

                          return next;
                        });
                      }}
                      disabled={isUnavailable || isAssigning}
                    >
                      <option value="">Select technician</option>

                      {technicians.map((technician) => (
                        <option key={technician.id} value={technician.id}>
                          {technician.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="assign-button"
                    disabled={!canSubmit}
                    onClick={() => {
                      if (selectedTechnicianId == null) {
                        setError("Please select a technician first.");
                        return;
                      }

                      void assignTechnician(
                        workOrder.id,
                        selectedTechnicianId
                      );
                    }}
                  >
                    {isAssigning
                      ? "Assigning..."
                      : isUnavailable
                        ? "Unavailable"
                        : workOrder.assignedTo != null
                          ? "Reassign"
                          : "Assign"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dispatch;