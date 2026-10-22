import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

interface DashboardSummary {
  totalWorkOrders: number;
  newWorkOrders: number;
  assignedWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  closedWorkOrders: number;
}

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

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const userName =
    localStorage.getItem("userName") || "User";

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const [
          summaryResponse,
          workOrdersResponse,
        ] = await Promise.all([
          apiFetch("/api/dashboard/summary"),
          apiFetch("/api/work-orders"),
        ]);

        if (
          summaryResponse.status === 401 ||
          workOrdersResponse.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("userName");
          localStorage.removeItem("userRole");

          navigate("/login");
          return;
        }

        if (
          !summaryResponse.ok ||
          !workOrdersResponse.ok
        ) {
          throw new Error(
            "Failed to load dashboard data"
          );
        }

        const summaryData: DashboardSummary =
          await summaryResponse.json();

        const workOrdersData: WorkOrder[] =
          await workOrdersResponse.json();

        setSummary(summaryData);
        setWorkOrders(workOrdersData);

      } catch (err) {
        console.error("Dashboard error:", err);
        setError(
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const overdueCount =
    workOrders.filter((workOrder) => {
      if (!workOrder.slaDueAt) {
        return false;
      }

      if (
        workOrder.status === "COMPLETED" ||
        workOrder.status === "CLOSED"
      ) {
        return false;
      }

      return (
        new Date(workOrder.slaDueAt).getTime() <
        Date.now()
      );
    }).length;

  const getSlaStatus = (
    workOrder: WorkOrder
  ) => {
    if (!workOrder.slaDueAt) {
      return "No SLA";
    }

    if (
      workOrder.status === "COMPLETED" ||
      workOrder.status === "CLOSED"
    ) {
      return "Completed";
    }

    return new Date(
      workOrder.slaDueAt
    ).getTime() < Date.now()
      ? "Overdue"
      : "SLA OK";
  };

  const firstName =
    userName.split(" ")[0];

  return (
    <div className="dashboard-page">

      <header className="topbar dashboard-topbar">

        <div>
          <p className="dashboard-eyebrow">
            OPERATIONS CENTER
          </p>

          <h1>
            Welcome back, {firstName} 👋
          </h1>

          <p>
            Here's what's happening across your
            field service operations.
          </p>
        </div>

        <button
          className="profile-button dashboard-action"
          onClick={() =>
            navigate("/work-orders")
          }
        >
          + New Work Order
        </button>

      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* KPI CARDS */}

      <section className="stats-grid dashboard-stats">

        <div className="stat-card dashboard-stat">
          <div className="stat-top">
            <span>Total Work Orders</span>

            <div className="stat-icon">
              ◫
            </div>
          </div>

          <strong>
            {loading
              ? "..."
              : summary?.totalWorkOrders ?? 0}
          </strong>

          <small>
            All service requests
          </small>
        </div>

        <div className="stat-card dashboard-stat">
          <div className="stat-top">
            <span>New Requests</span>

            <div className="stat-icon">
              +
            </div>
          </div>

          <strong>
            {loading
              ? "..."
              : summary?.newWorkOrders ?? 0}
          </strong>

          <small>
            Awaiting assignment
          </small>
        </div>

        <div className="stat-card dashboard-stat">
          <div className="stat-top">
            <span>In Progress</span>

            <div className="stat-icon">
              →
            </div>
          </div>

          <strong>
            {loading
              ? "..."
              : summary?.inProgressWorkOrders ?? 0}
          </strong>

          <small>
            Jobs being worked on
          </small>
        </div>

        <div className="stat-card dashboard-stat dashboard-stat-alert">
          <div className="stat-top">
            <span>Overdue</span>

            <div className="stat-icon alert-icon">
              !
            </div>
          </div>

          <strong>
            {loading ? "..." : overdueCount}
          </strong>

          <small>
            Open jobs past SLA
          </small>
        </div>

      </section>

      {/* MAIN DASHBOARD */}

      <section className="dashboard-grid">

        {/* RECENT WORK ORDERS */}

        <div className="panel recent-orders-panel">

          <div className="panel-header">

            <div>
              <h2>
                Recent Work Orders
              </h2>

              <p>
                Latest service activity
              </p>
            </div>

            <button
              className="view-button"
              onClick={() =>
                navigate("/work-orders")
              }
            >
              View all →
            </button>

          </div>

          {loading ? (

            <div className="dashboard-loading">
              Loading work orders...
            </div>

          ) : workOrders.length === 0 ? (

            <div className="empty-state">
              No work orders available.
            </div>

          ) : (

            <div className="dashboard-order-list">

              {workOrders
                .slice(0, 5)
                .map((workOrder) => {

                  const sla =
                    getSlaStatus(
                      workOrder
                    );

                  const slaClass =
                    sla === "Overdue"
                      ? "sla-overdue"
                      : sla === "SLA OK"
                        ? "sla-ok"
                        : sla === "Completed"
                          ? "sla-completed"
                          : "sla-none";

                  return (
                    <div
                      className="dashboard-order"
                      key={workOrder.id}
                      onClick={() =>
                        navigate(
                          "/work-orders"
                        )
                      }
                    >

                      <div
                        className={`order-status-indicator ${
                          workOrder.status
                            .toLowerCase()
                            .replace(
                              "_",
                              "-"
                            )
                        }`}
                      ></div>

                      <div className="dashboard-order-info">

                        <div className="order-title-row">

                          <strong>
                            {workOrder.code}
                          </strong>

                          <span className="priority">
                            {workOrder.priority}
                          </span>

                        </div>

                        <span>
                          {workOrder.title}
                        </span>

                      </div>

                      <div className="dashboard-order-right">

                        <span className="status">
                          {workOrder.status}
                        </span>

                        <span
                          className={`sla-badge ${slaClass}`}
                        >
                          {sla}
                        </span>

                      </div>

                    </div>
                  );
                })}

            </div>
          )}

        </div>

        {/* OPERATIONS OVERVIEW */}

        <div className="panel operations-panel">

          <div className="panel-header">

            <div>
              <h2>
                Operations Overview
              </h2>

              <p>
                Current workload
              </p>
            </div>

          </div>

          <div className="operations-list">

            <div className="operation-item">

              <div className="operation-label">
                <span>
                  New
                </span>

                <strong>
                  {loading
                    ? "..."
                    : summary?.newWorkOrders ??
                      0}
                </strong>
              </div>

              <div className="operation-track">
                <div
                  className="operation-bar new-bar"
                  style={{
                    width: `${
                      summary?.totalWorkOrders
                        ? Math.min(
                            100,
                            ((summary.newWorkOrders /
                              summary.totalWorkOrders) *
                              100)
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

            </div>

            <div className="operation-item">

              <div className="operation-label">
                <span>
                  Assigned
                </span>

                <strong>
                  {loading
                    ? "..."
                    : summary
                        ?.assignedWorkOrders ??
                      0}
                </strong>
              </div>

              <div className="operation-track">
                <div
                  className="operation-bar assigned-bar"
                  style={{
                    width: `${
                      summary?.totalWorkOrders
                        ? Math.min(
                            100,
                            ((summary.assignedWorkOrders /
                              summary.totalWorkOrders) *
                              100)
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

            </div>

            <div className="operation-item">

              <div className="operation-label">
                <span>
                  In Progress
                </span>

                <strong>
                  {loading
                    ? "..."
                    : summary
                        ?.inProgressWorkOrders ??
                      0}
                </strong>
              </div>

              <div className="operation-track">
                <div
                  className="operation-bar progress-bar"
                  style={{
                    width: `${
                      summary?.totalWorkOrders
                        ? Math.min(
                            100,
                            ((summary.inProgressWorkOrders /
                              summary.totalWorkOrders) *
                              100)
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

            </div>

            <div className="operation-item">

              <div className="operation-label">
                <span>
                  Completed
                </span>

                <strong>
                  {loading
                    ? "..."
                    : summary
                        ?.completedWorkOrders ??
                      0}
                </strong>
              </div>

              <div className="operation-track">
                <div
                  className="operation-bar completed-bar"
                  style={{
                    width: `${
                      summary?.totalWorkOrders
                        ? Math.min(
                            100,
                            ((summary.completedWorkOrders /
                              summary.totalWorkOrders) *
                              100)
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

            </div>

          </div>

          <div className="operations-summary">

            <div>
              <span>
                Closed
              </span>

              <strong>
                {summary?.closedWorkOrders ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Overdue
              </span>

              <strong className="operations-overdue">
                {overdueCount}
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* QUICK ACTIONS */}

      <section className="panel quick-panel">

        <div className="panel-header">

          <div>
            <h2>
              Quick Actions
            </h2>

            <p>
              Jump directly into common operations
            </p>
          </div>

        </div>

        <div className="dashboard-quick-actions">

          <button
            onClick={() =>
              navigate("/work-orders")
            }
          >
            <span className="quick-icon">
              +
            </span>

            <span>
              <strong>
                Create Work Order
              </strong>

              <small>
                Log a new service request
              </small>
            </span>

            <span className="quick-arrow">
              →
            </span>
          </button>

          <button
            onClick={() =>
              navigate("/dispatch")
            }
          >
            <span className="quick-icon">
              ↗
            </span>

            <span>
              <strong>
                Dispatch
              </strong>

              <small>
                Assign work to technicians
              </small>
            </span>

            <span className="quick-arrow">
              →
            </span>
          </button>

          <button
            onClick={() =>
              navigate("/customers")
            }
          >
            <span className="quick-icon">
              ◉
            </span>

            <span>
              <strong>
                Customers
              </strong>

              <small>
                Manage customers and sites
              </small>
            </span>

            <span className="quick-arrow">
              →
            </span>
          </button>

          <button
            onClick={() =>
              navigate("/inventory")
            }
          >
            <span className="quick-icon">
              □
            </span>

            <span>
              <strong>
                Inventory
              </strong>

              <small>
                Check available parts
              </small>
            </span>

            <span className="quick-arrow">
              →
            </span>
          </button>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;