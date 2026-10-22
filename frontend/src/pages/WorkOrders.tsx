import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import CreateWorkOrderForm from "../components/CreateWorkOrderForm";

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

function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const userRole = (
    localStorage.getItem("userRole") || ""
  ).toUpperCase();

  const canCreateWorkOrder =
    userRole === "MANAGER" || userRole === "DISPATCHER";

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
      console.error(err);
      setError("Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      setUpdatingId(id);
      setError("");

      const response = await apiFetch(
        `/api/work-orders/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update status (HTTP ${response.status})`
        );
      }

      const updatedWorkOrder: WorkOrder = await response.json();

      setWorkOrders((currentWorkOrders) =>
        currentWorkOrders.map((workOrder) =>
          workOrder.id === id ? updatedWorkOrder : workOrder
        )
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not update the work order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (status: string) => {
    switch (status) {
      case "NEW":
        return "ASSIGNED";
      case "ASSIGNED":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "COMPLETED";
      case "COMPLETED":
        return "CLOSED";
      default:
        return null;
    }
  };

  const getSlaStatus = (workOrder: WorkOrder) => {
    if (!workOrder.slaDueAt) {
      return { label: "No SLA", className: "sla-none" };
    }

    if (
      workOrder.status === "COMPLETED" ||
      workOrder.status === "CLOSED"
    ) {
      return { label: "Completed", className: "sla-completed" };
    }

    const dueTime = new Date(workOrder.slaDueAt).getTime();

    if (dueTime < Date.now()) {
      return { label: "OVERDUE", className: "sla-overdue" };
    }

    return { label: "SLA OK", className: "sla-ok" };
  };

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Work Orders</h1>
          <p>Manage and track maintenance jobs</p>
        </div>

        {canCreateWorkOrder && (
          <button
            type="button"
            className="profile-button"
            onClick={() => setShowCreateForm(true)}
          >
            + New Work Order
          </button>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="panel">
        {loading ? (
          <p>Loading work orders...</p>
        ) : workOrders.length === 0 ? (
          <p>No work orders found.</p>
        ) : (
          <div className="work-orders-table">
            <div className="work-order-row table-header">
              <span>Code</span>
              <span>Title</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Technician</span>
              <span>SLA</span>
              <span>Action</span>
            </div>

            {workOrders.map((workOrder) => {
              const nextStatus = getNextStatus(workOrder.status);
              const sla = getSlaStatus(workOrder);

              const canClose =
                userRole === "MANAGER";

              const canUpdateThisStatus =
                nextStatus !== null &&
                (nextStatus !== "CLOSED" || canClose);

              return (
                <div
                  className="work-order-row"
                  key={workOrder.id}
                >
                  <strong>{workOrder.code}</strong>
                  <span>{workOrder.title}</span>
                  <span className="priority">
                    {workOrder.priority}
                  </span>
                  <span className="status">
                    {workOrder.status}
                  </span>
                  <span>
                    {workOrder.assignedTo
                      ? `Technician #${workOrder.assignedTo}`
                      : "Unassigned"}
                  </span>
                  <span className={`sla-badge ${sla.className}`}>
                    {sla.label}
                  </span>

                  <span>
                    {canUpdateThisStatus && nextStatus ? (
                      <button
                        type="button"
                        className="action-button"
                        disabled={updatingId === workOrder.id}
                        onClick={() =>
                          updateStatus(workOrder.id, nextStatus)
                        }
                      >
                        {updatingId === workOrder.id
                          ? "Updating..."
                          : nextStatus === "ASSIGNED"
                            ? "Assign"
                            : nextStatus === "IN_PROGRESS"
                              ? "Start"
                              : nextStatus === "COMPLETED"
                                ? "Complete"
                                : "Close"}
                      </button>
                    ) : (
                      <span className="completed-label">
                        {workOrder.status === "CLOSED"
                          ? "Closed"
                          : "—"}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateForm && canCreateWorkOrder && (
        <CreateWorkOrderForm
          onCreated={loadWorkOrders}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

export default WorkOrders;