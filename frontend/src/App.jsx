import {
  BarChart3,
  Folder,
  LogOut,
  PieChart,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import BudgetsPage from "./pages/BudgetsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TransactionsPage from "./pages/TransactionsPage";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Sidebar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <button className="sidebar-brand sidebar-brand-button" onClick={handleLogout}>
          <div className="brand-mark">
            <Wallet />
          </div>
          <span className="brand-name">BudgetFlow</span>
        </button>

      <nav className="sidebar-nav">
        <NavLink className="sidebar-link" to="/dashboard">
          <BarChart3 />
          <span>Dashboard</span>
        </NavLink>

        <NavLink className="sidebar-link" to="/categories">
          <Folder />
          <span>Categories</span>
        </NavLink>

        <NavLink className="sidebar-link" to="/transactions">
          <Receipt />
          <span>Transactions</span>
        </NavLink>

        <NavLink className="sidebar-link" to="/budgets">
          <Target />
          <span>Budgets</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <BudgetsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}