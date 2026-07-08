import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/api";

function IncomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12l7 7 7-7" />
    </svg>
  );
}

function BalanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

const CHART_COLORS = {
  income: "#12b76a",
  expense: "#ef4444",
  pie: ["#3466f6", "#12b76a", "#f59e0b", "#ef4444", "#8b5cf6"],
};

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

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

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

  const selectedMonthName = MONTH_NAMES[Number(month) - 1] || "Selected month";

  const incomeExpenseData = dashboard
    ? [
        {
          name: "Income",
          amount: dashboard.total_income,
        },
        {
          name: "Expenses",
          amount: dashboard.total_expense,
        },
      ]
    : [];

  const expenseCategoryData = dashboard
    ? dashboard.top_expense_categories.map((category) => ({
        name: category.category_name,
        amount: category.total,
      }))
    : [];

  const budgetUsage =
    dashboard && dashboard.budget_total > 0
      ? Math.min((dashboard.total_expense / dashboard.budget_total) * 100, 100)
      : 0;

  function getDashboardInsight() {
    if (!dashboard) {
      return "Load a month to see your financial overview.";
    }

    if (dashboard.total_income === 0 && dashboard.total_expense === 0) {
      return "No activity yet for this month. Add income and expenses to unlock useful insights.";
    }

    if (dashboard.balance < 0) {
      return "Your expenses are higher than your income this month. Review your biggest categories and reduce flexible spending.";
    }

    if (dashboard.is_over_budget) {
      return "You are over your planned budget. Check your budget status and category breakdown below.";
    }

    return "You are keeping your monthly spending under control. Keep tracking transactions to stay consistent.";
  }

  function getBudgetMessage() {
    if (!dashboard || dashboard.budget_total === 0) {
      return "Create budgets for your expense categories to monitor spending limits.";
    }

    if (dashboard.is_over_budget) {
      return "You have passed your monthly budget. Focus on the categories with the highest spending.";
    }

    return "You are currently within your monthly budget. Nice work.";
  }

  return (
    <main className="page dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Monthly overview</span>
          <h1>Your financial command center</h1>
          <p>
            Review income, expenses, budget health, and spending patterns for{" "}
            {selectedMonthName} {year}.
          </p>
        </div>

        <div className="dashboard-filter-card">
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
            Refresh insights
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {!dashboard ? (
        <p className="empty-message">Loading dashboard...</p>
      ) : (
        <>
          <section className="dashboard-insight-card">
            <div>
              <span className="dashboard-insight-label">Smart insight</span>
              <h2>{formatMoney(dashboard.balance)} current balance</h2>
              <p>{getDashboardInsight()}</p>
            </div>

            <div className="dashboard-health-pill">
              {dashboard.balance >= 0 ? "Positive balance" : "Needs attention"}
            </div>
          </section>

          <section className="grid dashboard-grid dashboard-stat-grid">
            <div className="stat-card stat-card--income dashboard-stat-card">
              <div className="stat-icon">
                <IncomeIcon />
              </div>

              <div>
                <div className="stat-label">Total income</div>
                <div className="stat-value">
                  {formatMoney(dashboard.total_income)}
                </div>
                <p>Money added during this month.</p>
              </div>
            </div>

            <div className="stat-card stat-card--expense dashboard-stat-card">
              <div className="stat-icon">
                <ExpenseIcon />
              </div>

              <div>
                <div className="stat-label">Total expenses</div>
                <div className="stat-value">
                  {formatMoney(dashboard.total_expense)}
                </div>
                <p>Total spending recorded this month.</p>
              </div>
            </div>

            <div className="stat-card stat-card--balance dashboard-stat-card">
              <div className="stat-icon">
                <BalanceIcon />
              </div>

              <div>
                <div className="stat-label">Balance</div>
                <div className="stat-value">{formatMoney(dashboard.balance)}</div>
                <p>Income minus expenses.</p>
              </div>
            </div>

            <div className="stat-card stat-card--budget dashboard-stat-card">
              <div className="stat-icon">
                <BudgetIcon />
              </div>

              <div>
                <div className="stat-label">Budget remaining</div>
                <div className="stat-value">
                  {formatMoney(dashboard.budget_remaining)}
                </div>
                <p>Available amount based on your budget.</p>
              </div>
            </div>
          </section>

          <section className="dashboard-main-grid">
            <div className="card dashboard-chart-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Income vs expenses</h2>
                  <p>Compare how much came in against how much went out.</p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeExpenseData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#eef1f6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7690", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7690", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => formatMoney(value)}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e4e9f2",
                        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                      }}
                    />
                    <Bar dataKey="amount" radius={[12, 12, 0, 0]} maxBarSize={90}>
                      {incomeExpenseData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Income"
                              ? CHART_COLORS.income
                              : CHART_COLORS.expense
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card dashboard-chart-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Expense breakdown</h2>
                  <p>See which categories are driving your monthly spending.</p>
                </div>
              </div>

              {expenseCategoryData.length === 0 ? (
                <p className="empty-message">No expense data yet.</p>
              ) : (
                <div className="dashboard-pie-layout">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={expenseCategoryData}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                        >
                          {expenseCategoryData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                CHART_COLORS.pie[index % CHART_COLORS.pie.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="dashboard-category-list">
                    {expenseCategoryData.map((category, index) => (
                      <div key={category.name}>
                        <span
                          style={{
                            background:
                              CHART_COLORS.pie[index % CHART_COLORS.pie.length],
                          }}
                        />
                        <p>{category.name}</p>
                        <strong>{formatMoney(category.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-bottom-grid">
            <div className="card dashboard-budget-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Budget health</h2>
                  <p>{getBudgetMessage()}</p>
                </div>

                <strong>{Math.round(budgetUsage)}%</strong>
              </div>

              <div className="budget-progress">
                <div className="budget-progress-header">
                  <span>Monthly budget usage</span>
                  <span>
                    {formatMoney(dashboard.total_expense)} /{" "}
                    {formatMoney(dashboard.budget_total)}
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className={
                      dashboard.is_over_budget
                        ? "progress-fill progress-fill-danger"
                        : "progress-fill"
                    }
                    style={{
                      width: `${budgetUsage}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card dashboard-activity-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>Recent activity</h2>
                  <p>Your latest transactions for this month.</p>
                </div>
              </div>

              {dashboard.recent_transactions.length === 0 ? (
                <p className="empty-message">No transactions yet.</p>
              ) : (
                <div className="activity-list">
                  {dashboard.recent_transactions.map((transaction) => (
                    <div className="activity-item" key={transaction.id}>
                      <div>
                        <strong>
                          {transaction.description || transaction.category_name}
                        </strong>
                        <span>
                          {transaction.transaction_date} ·{" "}
                          {transaction.category_name}
                        </span>
                      </div>

                      <p
                        className={
                          transaction.type === "income"
                            ? "activity-amount activity-amount-income"
                            : "activity-amount activity-amount-expense"
                        }
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatMoney(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}