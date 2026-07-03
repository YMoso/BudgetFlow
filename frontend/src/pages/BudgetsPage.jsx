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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/budgets/", {
        amount: Number(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year),
        category_id: Number(formData.category_id),
      });

      setFormData({
        ...formData,
        amount: "",
        category_id: "",
      });

      fetchBudgets();
      fetchSummary();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not create budget");
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

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  return (
    <div>
      <h1>Budgets</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="amount"
          placeholder="Budget amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
        />

        <input
          name="month"
          placeholder="Month"
          type="number"
          min="1"
          max="12"
          value={formData.month}
          onChange={handleChange}
        />

        <input
          name="year"
          placeholder="Year"
          type="number"
          value={formData.year}
          onChange={handleChange}
        />

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

        <button type="submit">Add budget</button>
      </form>

      <button onClick={fetchSummary}>Load monthly summary</button>

      <h2>Your budgets</h2>

      {budgets.length === 0 ? (
        <p>No budgets yet.</p>
      ) : (
        <ul>
          {budgets.map((budget) => (
            <li key={budget.id}>
              {budget.month}/{budget.year} — {budget.amount} — category ID:{" "}
              {budget.category_id}{" "}
              <button onClick={() => deleteBudget(budget.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <h2>Budget summary</h2>

      {summary.length === 0 ? (
        <p>No summary loaded.</p>
      ) : (
        <ul>
          {summary.map((item) => (
            <li key={item.category_id}>
              {item.category_name}: budget {item.budget_amount}, spent{" "}
              {item.spent_amount}, remaining {item.remaining},{" "}
              {item.is_over_budget ? "over budget" : "within budget"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}