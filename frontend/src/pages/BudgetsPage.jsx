import { useEffect, useState } from "react";
import api from "../api/api";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    month: "7",
    year: "2026",
    category_id: "",
  });
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [error, setError] = useState("");

  async function fetchBudgets() {
    try {
      const response = await api.get("/budgets/");
      setBudgets(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load budgets");
    }
  }

  async function fetchCategories() {
    try {
      const response = await api.get("/categories/");
      setCategories(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load categories");
    }
  }

  async function fetchSummary() {
    try {
      const response = await api.get(
        `/budgets/summary/monthly?year=${formData.year}&month=${formData.month}`
      );
      setSummary(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load budget summary");
    }
  }

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function resetForm() {
    setFormData({
      amount: "",
      month: "7",
      year: "2026",
      category_id: "",
    });
    setEditingBudgetId(null);
  }

  function startEditing(budget) {
    setEditingBudgetId(budget.id);
    setFormData({
      amount: String(budget.amount),
      month: String(budget.month),
      year: String(budget.year),
      category_id: String(budget.category_id),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      amount: Number(formData.amount),
      month: Number(formData.month),
      year: Number(formData.year),
      category_id: Number(formData.category_id),
    };

    try {
      if (editingBudgetId) {
        await api.put(`/budgets/${editingBudgetId}`, payload);
      } else {
        await api.post("/budgets/", payload);
      }

      resetForm();
      fetchBudgets();
      fetchSummary();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not save budget");
    }
  }

  async function deleteBudget(budgetId) {
    try {
      await api.delete(`/budgets/${budgetId}`);
      fetchBudgets();
      fetchSummary();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not delete budget");
    }
  }

  function getCategoryName(categoryId) {
    const category = categories.find((category) => category.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  }

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  return (
    <main className="page">
      <div className="page-header">
        <h1>Budgets</h1>
        <p>Set and edit monthly budgets for your expense categories.</p>
      </div>

      <div className="card">
        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Amount</label>
              <input
                name="amount"
                placeholder="500"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Select expense category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Month</label>
              <input
                name="month"
                type="number"
                min="1"
                max="12"
                value={formData.month}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Year</label>
              <input
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn" type="submit">
              {editingBudgetId ? "Update budget" : "Add budget"}
            </button>

            {editingBudgetId && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <button className="btn" onClick={fetchSummary}>
          Load monthly summary
        </button>
      </div>

      <div className="card">
        <h2>Your budgets</h2>

        {budgets.length === 0 ? (
          <p className="empty-message">No budgets yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>{budget.month}</td>
                    <td>{budget.year}</td>
                    <td>{budget.amount}</td>
                    <td>{getCategoryName(budget.category_id)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => startEditing(budget)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() => deleteBudget(budget.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Budget summary</h2>

        {summary.length === 0 ? (
          <p className="empty-message">No summary loaded.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {summary.map((item) => (
                  <tr key={item.category_id}>
                    <td>{item.category_name}</td>
                    <td>{item.budget_amount}</td>
                    <td>{item.spent_amount}</td>
                    <td>{item.remaining}</td>
                    <td>
                      {item.is_over_budget ? "Over budget" : "Within budget"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}