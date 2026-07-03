import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("7");
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setError("");
      const response = await api.get(
        `/dashboard/monthly?year=${year}&month=${month}`
      );
      setDashboard(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load dashboard");
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={logout}>Logout</button>

      <div>
        <input
          type="number"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />

        <input
          type="number"
          min="1"
          max="12"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />

        <button onClick={fetchDashboard}>Load dashboard</button>
      </div>

      {error && <p>{error}</p>}

      {!dashboard ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>
            {dashboard.month}/{dashboard.year}
          </h2>

          <p>Total income: {dashboard.total_income}</p>
          <p>Total expense: {dashboard.total_expense}</p>
          <p>Balance: {dashboard.balance}</p>
          <p>Budget total: {dashboard.budget_total}</p>
          <p>Budget remaining: {dashboard.budget_remaining}</p>
          <p>{dashboard.is_over_budget ? "Over budget" : "Within budget"}</p>

          <h2>Top expense categories</h2>
          {dashboard.top_expense_categories.length === 0 ? (
            <p>No expense categories yet.</p>
          ) : (
            <ul>
              {dashboard.top_expense_categories.map((category) => (
                <li key={category.category_id}>
                  {category.category_name}: {category.total}
                </li>
              ))}
            </ul>
          )}

          <h2>Recent transactions</h2>
          {dashboard.recent_transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            <ul>
              {dashboard.recent_transactions.map((transaction) => (
                <li key={transaction.id}>
                  {transaction.transaction_date} — {transaction.description} —{" "}
                  {transaction.amount} — {transaction.category_name}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}