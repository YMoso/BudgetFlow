import { useEffect, useState } from "react";
import api from "../api/api";

function getCurrentMonth() {
  return String(new Date().getMonth() + 1);
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function formatMoney(value) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    month: getCurrentMonth(),
    year: getCurrentYear(),
    category_id: "",
  });
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  useEffect(() => {
    fetchSummary();
  }, [formData.month, formData.year]);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function showSuccess(message) {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  }

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  function resetForm() {
    setFormData({
      amount: "",
      month: formData.month,
      year: formData.year,
      category_id: "",
    });
    setEditingBudgetId(null);
  }

  async function deleteCategory(categoryId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this category?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/categories/${categoryId}`);
    await fetchCategories();
  } catch (error) {
    setError(error.response?.data?.detail || "Could not delete category");
  }
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

  function validateForm() {
    if (!formData.amount || Number(formData.amount) <= 0) {
      return "Please enter a valid budget amount.";
    }

    if (!formData.category_id) {
      return "Please select an expense category.";
    }

    if (
      !formData.month ||
      Number(formData.month) < 1 ||
      Number(formData.month) > 12
    ) {
      return "Please enter a valid month between 1 and 12.";
    }

    if (!formData.year || Number(formData.year) < 2000) {
      return "Please enter a valid year.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      amount: Number(formData.amount),
      month: Number(formData.month),
      year: Number(formData.year),
      category_id: Number(formData.category_id),
    };

    try {
      if (editingBudgetId) {
        await api.put(`/budgets/${editingBudgetId}`, payload);
        showSuccess("Budget updated successfully.");
      } else {
        await api.post("/budgets/", payload);
        showSuccess("Budget created successfully.");
      }

      resetForm();
      await fetchBudgets();
      await fetchSummary();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not save budget");
    }
  }

 async function deleteBudget(budgetId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await api.delete(`/budgets/${budgetId}`);
      await fetchBudgets();
      await fetchSummary();
      showSuccess("Budget deleted successfully.");
    } catch (error) {
      setError(error.response?.data?.detail || "Could not delete budget");
    }
  }

  function getCategoryName(categoryId) {
    const category = categories.find((category) => category.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  }

  function getUsagePercentage(item) {
    if (item.budget_amount <= 0) {
      return 0;
    }

    return Math.min((item.spent_amount / item.budget_amount) * 100, 100);
  }

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const totalBudget = summary.reduce(
    (total, item) => total + item.budget_amount,
    0
  );

  const totalSpent = summary.reduce(
    (total, item) => total + item.spent_amount,
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  const overBudgetCount = summary.filter((item) => item.is_over_budget).length;

  const selectedMonthName =
    MONTH_NAMES[Number(formData.month) - 1] || "Selected month";

  const overallUsage =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <main className="page budgets-page">
      <section className="budgets-hero">
        <div>
          <span className="eyebrow">Budget planner</span>
          <h1>Plan your spending before it happens</h1>
          <p>
            Set monthly limits for your expense categories and track how much
            you have used during {selectedMonthName} {formData.year}.
          </p>
        </div>

        <div className="budgets-hero-card">
          <span>Budget health</span>
          <strong>
            {totalBudget === 0
              ? "No budget yet"
              : overBudgetCount > 0
                ? "Needs attention"
                : "On track"}
          </strong>
          <p>
            {totalBudget === 0
              ? "Create your first monthly budget to start tracking spending limits."
              : overBudgetCount > 0
                ? `${overBudgetCount} category is over budget this month.`
                : "Your planned spending is currently under control."}
          </p>
        </div>
      </section>

      <section className="budgets-summary-grid">
        <div className="budget-summary-card budget-summary-planned">
          <span>Planned budget</span>
          <strong>{formatMoney(totalBudget)}</strong>
          <p>Total amount planned for selected month.</p>
        </div>

        <div className="budget-summary-card budget-summary-spent">
          <span>Spent this month</span>
          <strong>{formatMoney(totalSpent)}</strong>
          <p>Total expenses connected to your budgets.</p>
        </div>

        <div className="budget-summary-card budget-summary-remaining">
          <span>Remaining</span>
          <strong>{formatMoney(totalRemaining)}</strong>
          <p>Money left before reaching your planned limit.</p>
        </div>

        <div className="budget-summary-card budget-summary-alert">
          <span>Over-budget categories</span>
          <strong>{overBudgetCount}</strong>
          <p>Categories that need attention this month.</p>
        </div>
      </section>

      <section className="budgets-layout-grid">
        <div className="card budget-form-card">
          <div className="budget-card-header">
            <div>
              <h2>{editingBudgetId ? "Edit budget" : "Create budget"}</h2>
              <p>
                {editingBudgetId
                  ? "Update the amount, month, year, or category."
                  : "Create a monthly spending limit for an expense category."}
              </p>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          {successMessage && <p className="success">{successMessage}</p>}

          <form className="form" onSubmit={handleSubmit}>
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

            <div className="budget-form-tip">
              <strong>Tip</strong>
              <p>
                Budgets work best for recurring expense categories like food,
                transport, subscriptions, rent, and entertainment.
              </p>
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

        <div className="card budget-overview-card">
          <div className="budget-card-header">
            <div>
              <h2>Monthly overview</h2>
              <p>
                Summary for {selectedMonthName} {formData.year}.
              </p>
            </div>

            <button className="btn btn-secondary" onClick={fetchSummary}>
              Refresh
            </button>
          </div>

          <div className="budget-overall-progress">
            <div className="budget-progress-header">
              <span>Overall budget usage</span>
              <span>
                {formatMoney(totalSpent)} / {formatMoney(totalBudget)}
              </span>
            </div>

            <div className="progress-bar">
              <div
                className={
                  overBudgetCount > 0
                    ? "progress-fill progress-fill-danger"
                    : "progress-fill"
                }
                style={{
                  width: `${overallUsage}%`,
                }}
              />
            </div>

            <p>
              {totalBudget === 0
                ? "No budgets created for this month yet."
                : `${Math.round(overallUsage)}% of your planned budget has been used.`}
            </p>
          </div>

          {summary.length === 0 ? (
            <div className="budget-empty-state">
              <h3>No budget summary yet</h3>
              <p>
                Create a budget for an expense category to see progress and
                remaining amount here.
              </p>
            </div>
          ) : (
            <div className="budget-summary-list">
              {summary.map((item) => {
                const usagePercentage = getUsagePercentage(item);

                return (
                  <div className="budget-summary-item" key={item.category_id}>
                    <div className="budget-summary-top">
                      <div>
                        <h3>{item.category_name}</h3>
                        <p>
                          {formatMoney(item.spent_amount)} spent of{" "}
                          {formatMoney(item.budget_amount)}
                        </p>
                      </div>

                      <span
                        className={
                          item.is_over_budget
                            ? "status-pill status-pill-danger"
                            : "status-pill status-pill-success"
                        }
                      >
                        {item.is_over_budget ? "Over budget" : "Within budget"}
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className={
                          item.is_over_budget
                            ? "progress-fill progress-fill-danger"
                            : "progress-fill"
                        }
                        style={{
                          width: `${usagePercentage}%`,
                        }}
                      />
                    </div>

                    <div className="budget-summary-bottom">
                      <span>{Math.round(usagePercentage)}% used</span>
                      <span>Remaining: {formatMoney(item.remaining)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="card budget-list-card">
        <div className="budget-card-header">
          <div>
            <h2>Your budgets</h2>
            <p>Manage all monthly limits you have created.</p>
          </div>
        </div>

        {budgets.length === 0 ? (
          <div className="budget-empty-state">
            <h3>No budgets yet</h3>
            <p>
              Add your first budget to start planning and comparing expenses.
            </p>
          </div>
        ) : (
          <div className="budget-card-list">
            {budgets.map((budget) => (
              <div className="budget-item-card" key={budget.id}>
                <div className="budget-item-main">
                  <div className="budget-icon">◎</div>

                  <div>
                    <strong>{getCategoryName(budget.category_id)}</strong>
                    <span>
                      {MONTH_NAMES[budget.month - 1] || budget.month}{" "}
                      {budget.year}
                    </span>
                  </div>
                </div>

                <div className="budget-item-side">
                  <p>{formatMoney(budget.amount)}</p>

                  <div className="budget-item-actions">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}