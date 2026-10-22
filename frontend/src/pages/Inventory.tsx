import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

interface Part {
  id: number;
  name: string;
  sku: string;
  unitCost: number;
  stockQty: number;
}

function Inventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/parts");

      if (!response.ok) {
        throw new Error("Failed to load inventory");
      }

      const data: Part[] = await response.json();
      setParts(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const totalStockUnits = parts.reduce(
    (total, part) => total + part.stockQty,
    0
  );

  const lowStockCount = parts.filter(
    (part) => part.stockQty <= 3
  ).length;

  const inventoryValue = parts.reduce(
    (total, part) =>
      total + Number(part.unitCost) * part.stockQty,
    0
  );

  const healthyParts =
    parts.length > 0
      ? ((parts.length - lowStockCount) / parts.length) * 100
      : 0;

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Inventory</h1>
          <p>
            Manage parts and monitor stock levels
          </p>
        </div>

        <button
          className="profile-button"
          onClick={loadParts}
        >
          Refresh Inventory
        </button>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="inventory-summary-grid">

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">
            📦
          </div>

          <div>
            <span>Total Parts</span>
            <strong>
              {loading ? "..." : parts.length}
            </strong>
            <small>
              Different items
            </small>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">
            📊
          </div>

          <div>
            <span>Stock Units</span>
            <strong>
              {loading ? "..." : totalStockUnits}
            </strong>
            <small>
              Units currently available
            </small>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon warning">
            ⚠
          </div>

          <div>
            <span>Low Stock</span>
            <strong>
              {loading ? "..." : lowStockCount}
            </strong>
            <small>
              Items needing attention
            </small>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">
            ₹
          </div>

          <div>
            <span>Inventory Value</span>
            <strong>
              {loading
                ? "..."
                : `₹${inventoryValue.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}`}
            </strong>
            <small>
              Current stock value
            </small>
          </div>
        </div>

      </div>

      <div className="panel inventory-panel">

        <div className="panel-header">

          <div>
            <h2>Parts Inventory</h2>
            <p>
              Available parts for maintenance work
            </p>
          </div>

        </div>

        {loading ? (
          <p>Loading inventory...</p>
        ) : parts.length === 0 ? (
          <p>No parts found.</p>
        ) : (
          <div className="inventory-table">

            <div className="inventory-row inventory-header">
              <span>Part</span>
              <span>SKU</span>
              <span>Unit Cost</span>
              <span>Stock</span>
              <span>Status</span>
            </div>

            {parts.map((part) => {

              const lowStock =
                part.stockQty <= 3;

              return (
                <div
                  className="inventory-row"
                  key={part.id}
                >

                  <div className="inventory-part">
                    <div className="inventory-part-icon">
                      ⚙
                    </div>

                    <div>
                      <strong>
                        {part.name}
                      </strong>

                      <small>
                        Maintenance part
                      </small>
                    </div>
                  </div>

                  <span>
                    {part.sku}
                  </span>

                  <span>
                    ₹
                    {Number(
                      part.unitCost
                    ).toFixed(2)}
                  </span>

                  <strong>
                    {part.stockQty}
                  </strong>

                  <span
                    className={
                      lowStock
                        ? "stock-low"
                        : "stock-good"
                    }
                  >
                    {lowStock
                      ? "Low Stock"
                      : "In Stock"}
                  </span>

                </div>
              );
            })}

          </div>
        )}

      </div>

      <div className="inventory-bottom-grid">

        <div className="panel">

          <div className="panel-header">
            <div>
              <h2>Inventory Health</h2>
              <p>
                Overall stock availability
              </p>
            </div>

            <span className="health-label">
              {healthyParts >= 80
                ? "Healthy"
                : healthyParts >= 50
                  ? "Watch"
                  : "Needs Attention"}
            </span>
          </div>

          <div className="health-bar">
            <div
              className="health-bar-fill"
              style={{
                width: `${healthyParts}%`,
              }}
            ></div>
          </div>

          <div className="health-footer">
            <span>
              {parts.length -
                lowStockCount} of{" "}
              {parts.length} parts adequately
              stocked
            </span>

            <strong>
              {Math.round(healthyParts)}%
            </strong>
          </div>

        </div>

        <div className="panel inventory-info-panel">

          <div className="panel-header">
            <div>
              <h2>Inventory Notes</h2>
              <p>
                Keep maintenance operations ready
              </p>
            </div>
          </div>

          <div className="inventory-note">
            <span className="note-icon">
              ✓
            </span>

            <div>
              <strong>
                Stock visibility
              </strong>

              <p>
                Track available parts before
                dispatching technicians.
              </p>
            </div>
          </div>

          <div className="inventory-note">
            <span className="note-icon warning">
              !
            </span>

            <div>
              <strong>
                Low-stock monitoring
              </strong>

              <p>
                Items with 3 or fewer units are
                flagged automatically.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Inventory;