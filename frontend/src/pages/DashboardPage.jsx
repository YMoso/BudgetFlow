import { useEffect, useState } from "react";
import api from "../api/api";

export default function DashboardPage() {
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your monthly financial overview.</p>
      </div>

      <div className="card">
        <div className="inline-controls">
          <div className="form-row">
            <label>Year</label>
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>

          <button className="btn" onClick={fetchDashboard}>
            Load dashboard
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!dashboard ? (
        <p className="empty-message">Loading...</p>
      ) : (
        <>
          <section className="grid dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Total income</div>
              <div className="stat-value">{dashboard.total_income}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total expense</div>
              <div className="stat-value">{dashboard.total_expense}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Balance</div>
              <div className="stat-value">{dashboard.balance}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Budget remaining</div>
              <div className="stat-value">{dashboard.budget_remaining}</div>
            </div>
          </section>

          <div className="card">
            <h2>Top expense categories</h2>

            {dashboard.top_expense_categories.length === 0 ? (
              <p className="empty-message">No expense categories yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.top_expense_categories.map((category) => (
                      <tr key={category.category_id}>
                        <td>{category.category_name}</td>
                        <td>{category.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Recent transactions</h2>

            {dashboard.recent_transactions.length === 0 ? (
              <p className="empty-message">No transactions yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recent_transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.transaction_date}</td>
                        <td>{transaction.description}</td>
                        <td>{transaction.amount}</td>
                        <td>{transaction.category_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}