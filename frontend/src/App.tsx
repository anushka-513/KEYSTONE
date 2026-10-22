
import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import React from "react";
import Dashboard from "./pages/Dashboard";
import WorkOrders from "./pages/WorkOrders";
import Dispatch from "./pages/Dispatch";
import Technicians from "./pages/Technicians";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import CustomerPortal from "./pages/CustomerPortal";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

type Theme = "light" | "dark";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location.href = "/login";
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
      <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}

function UserBox({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  return (
    <div className="user-box">
      <div className="avatar">{getInitials(userName)}</div>
      <div>
        <strong>{userName}</strong>
        <span>{userRole}</span>
      </div>
    </div>
  );
}

type LayoutProps = {
  userName: string;
  userRole: string;
  theme: Theme;
  onToggleTheme: () => void;
};

function CustomerLayout({
  userName,
  userRole,
  theme,
  onToggleTheme,
}: LayoutProps) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">K</div>
          <div>
            <h2>KEYSTONE</h2>
            <span>Customer Services</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink
            to="/customer-portal"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            My Requests
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <UserBox userName={userName} userRole={userRole} />
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function StaffLayout({
  userName,
  userRole,
  theme,
  onToggleTheme,
}: LayoutProps) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">K</div>
          <div>
            <h2>KEYSTONE</h2>
            <span>Field Service</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/work-orders"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Work Orders
          </NavLink>

          <NavLink
            to="/dispatch"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Dispatch
          </NavLink>

          <NavLink
            to="/technicians"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Technicians
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Customers
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Inventory
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <UserBox userName={userName} userRole={userRole} />
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [authVersion, setAuthVersion] = React.useState(0);

  const [theme, setTheme] = React.useState<Theme>(() => {
    return localStorage.getItem("keystone-theme") === "dark"
      ? "dark"
      : "light";
  });

  React.useEffect(() => {
    const syncAuth = () => setAuthVersion((version) => version + 1);

    window.addEventListener("storage", syncAuth);
    window.addEventListener("keystone-auth-changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("keystone-auth-changed", syncAuth);
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("keystone-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    const syncTheme = () => {
      setTheme(
        localStorage.getItem("keystone-theme") === "dark" ? "dark" : "light"
      );
    };

    window.addEventListener("keystone-theme-changed", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("keystone-theme-changed", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  void authVersion;

  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "User";
  const isCustomer = userRole === "CUSTOMER";
  const homePath = isCustomer ? "/customer-portal" : "/";

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to={homePath} replace /> : <Login />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/customer-portal"
          element={
            isCustomer ? (
              <CustomerLayout
                userName={userName}
                userRole={userRole}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route index element={<CustomerPortal />} />
        </Route>

        <Route
          path="/*"
          element={
            isCustomer ? (
              <Navigate to="/customer-portal" replace />
            ) : (
              <StaffLayout
                userName={userName}
                userRole={userRole}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            )
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}

export default App;
