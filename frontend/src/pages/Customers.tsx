import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

interface Customer {
  id: number;
  name: string;
  contactEmail: string;
}

interface Site {
  id: number;
  customerId: number;
  name: string;
  address: string;
}

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSites, setLoadingSites] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/customers");

      if (!response.ok) {
        throw new Error("Failed to load customers");
      }

      const data: Customer[] = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async (customerId: number) => {
    try {
      setLoadingSites(true);
      setError("");
      setSelectedCustomer(customerId);

      const response = await apiFetch(
        `/api/sites/customer/${customerId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load sites");
      }

      const data: Site[] = await response.json();
      setSites(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load customer sites.");
    } finally {
      setLoadingSites(false);
    }
  };

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Customers</h1>
          <p>Manage customers and their service locations</p>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="customers-layout">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Customers</h2>
              <p>Registered service customers</p>
            </div>
          </div>

          {loading ? (
            <p>Loading customers...</p>
          ) : customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <div className="customer-list">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  className={`customer-card ${
                    selectedCustomer === customer.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => loadSites(customer.id)}
                >
                  <div className="customer-avatar">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="customer-info">
                    <strong>{customer.name}</strong>
                    <span>{customer.contactEmail}</span>
                  </div>

                  <span className="customer-arrow">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Service Sites</h2>
              <p>
                {selectedCustomer
                  ? "Sites belonging to the selected customer"
                  : "Select a customer to view their sites"}
              </p>
            </div>
          </div>

          {!selectedCustomer ? (
            <div className="empty-state">
              Select a customer from the left.
            </div>
          ) : loadingSites ? (
            <p>Loading sites...</p>
          ) : sites.length === 0 ? (
            <div className="empty-state">
              No sites found for this customer.
            </div>
          ) : (
            <div className="site-list">
              {sites.map((site) => (
                <div
                  className="site-card"
                  key={site.id}
                >
                  <div className="site-icon">⌂</div>

                  <div>
                    <strong>{site.name}</strong>
                    <span>{site.address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customers;
