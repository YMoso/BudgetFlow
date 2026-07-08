import { useEffect, useState } from "react";
import api from "../api/api";


function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatMoney(value) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    type: "expense",
    transaction_date: getTodayDate(),
    category_id: "",
  });
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchTransactions() {
    try {
      const response = await api.get("/transactions/");
      setTransactions(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load transactions");
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

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousFormData) => {
      if (name === "type") {
        return {
          ...previousFormData,
          type: value,
          category_id: "",
        };
      }

      return {
        ...previousFormData,
        [name]: value,
      };
    });
  }

  function resetForm() {
    setFormData({
      amount: "",
      description: "",
      type: "expense",
      transaction_date: getTodayDate(),
      category_id: "",
    });
    setEditingTransactionId(null);
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

  function startEditing(transaction) {
    setEditingTransactionId(transaction.id);
    setFormData({
      amount: String(transaction.amount),
      description: transaction.description || "",
      type: transaction.type,
      transaction_date: transaction.transaction_date,
      category_id: String(transaction.category_id),
    });
  }

  function validateForm() {
    if (!formData.amount || Number(formData.amount) <= 0) {
      return "Please enter a valid amount.";
    }

    if (!formData.transaction_date) {
      return "Please select a transaction date.";
    }

    if (!formData.category_id) {
      return "Please select a category.";
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
      description: formData.description,
      type: formData.type,
      transaction_date: formData.transaction_date,
      category_id: Number(formData.category_id),
    };

    try {
      if (editingTransactionId) {
        await api.put(`/transactions/${editingTransactionId}`, payload);
        showSuccess("Transaction updated successfully.");
      } else {
        await api.post("/transactions/", payload);
        showSuccess("Transaction created successfully.");
      }

      resetForm();
      await fetchTransactions();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not save transaction");
    }
  }

  async function deleteTransaction(transactionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await api.delete(`/transactions/${transactionId}`);
      await fetchTransactions();
      showSuccess("Transaction deleted successfully.");
    } catch (error) {
      setError(error.response?.data?.detail || "Could not delete transaction");
    }
  }

  function getCategoryName(categoryId) {
    const category = categories.find((category) => category.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  }

  const filteredCategories = categories.filter(
    (category) => category.type === formData.type
  );

  const incomeTransactions = transactions.filter(
    (transaction) => transaction.type === "income"
  );

  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense"
  );

  const totalIncome = incomeTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const totalExpenses = expenseTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const latestTransaction = transactions[0];

  return (
    <main className="page transactions-page">
      <section className="transactions-hero">
        <div>
          <span className="eyebrow">Transaction tracker</span>
          <h1>Track every movement in your money</h1>
          <p>
            Add income and expenses as they happen. Your transactions power the
            dashboard, category insights, and budget progress.
          </p>
        </div>

        <div className="transactions-hero-card">
          <span>Current activity</span>
          <strong>{transactions.length} transactions</strong>
          <p>
            {transactions.length === 0
              ? "Start by adding your first income or expense transaction."
              : "Your latest activity is shaping your monthly financial picture."}
          </p>
        </div>
      </section>

      <section className="transactions-summary-grid">
        <div className="transaction-summary-card transaction-summary-income">
          <span>Total income</span>
          <strong>{formatMoney(totalIncome)}</strong>
          <p>All income transactions currently recorded.</p>
        </div>

        <div className="transaction-summary-card transaction-summary-expense">
          <span>Total expenses</span>
          <strong>{formatMoney(totalExpenses)}</strong>
          <p>All expense transactions currently recorded.</p>
        </div>

        <div className="transaction-summary-card transaction-summary-balance">
          <span>Net movement</span>
          <strong>{formatMoney(totalIncome - totalExpenses)}</strong>
          <p>Income minus expenses across your transactions.</p>
        </div>

        <div className="transaction-summary-card transaction-summary-latest">
          <span>Latest transaction</span>
          <strong>
            {latestTransaction
              ? formatMoney(latestTransaction.amount)
              : "None yet"}
          </strong>
          <p>
            {latestTransaction
              ? `${latestTransaction.transaction_date} · ${getCategoryName(
                  latestTransaction.category_id
                )}`
              : "Add a transaction to start building history."}
          </p>
        </div>
      </section>

      <section className="transactions-layout-grid">
        <div className="card transaction-form-card">
          <div className="transaction-card-header">
            <div>
              <h2>
                {editingTransactionId
                  ? "Edit transaction"
                  : "Add transaction"}
              </h2>
              <p>
                {editingTransactionId
                  ? "Update the details for this transaction."
                  : "Record money coming in or going out today."}
              </p>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          {successMessage && <p className="success">{successMessage}</p>}

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-row">
                <label>Amount</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="45.50"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>Date</label>
                <input
                  name="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <label>Description</label>
              <input
                name="description"
                placeholder="Grocery shopping"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label>Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-row">
                <label>Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="transaction-form-tip">
              <strong>Tip</strong>
              <p>
                Add transactions regularly to keep your dashboard accurate and
                your monthly budget progress up to date.
              </p>
            </div>

            <div className="actions">
              <button className="btn" type="submit">
                {editingTransactionId
                  ? "Update transaction"
                  : "Add transaction"}
              </button>

              {editingTransactionId && (
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

        <div className="card transaction-list-card">
          <div className="transaction-card-header">
            <div>
              <h2>Your transactions</h2>
              <p>Review, edit, or delete your recorded activity.</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="transaction-empty-state">
              <h3>No transactions yet</h3>
              <p>
                Add your first income or expense transaction to activate your
                financial overview.
              </p>
            </div>
          ) : (
            <div className="transaction-card-list">
              {transactions.map((transaction) => (
                <div className="transaction-item-card" key={transaction.id}>
                  <div className="transaction-item-main">
                    <div
                      className={
                        transaction.type === "income"
                          ? "transaction-icon transaction-icon-income"
                          : "transaction-icon transaction-icon-expense"
                      }
                    >
                      {transaction.type === "income" ? "↑" : "↓"}
                    </div>

                    <div>
                      <strong>
                        {transaction.description ||
                          getCategoryName(transaction.category_id)}
                      </strong>
                      <span>
                        {transaction.transaction_date} ·{" "}
                        {getCategoryName(transaction.category_id)}
                      </span>
                    </div>
                  </div>

                  <div className="transaction-item-side">
                    <p
                      className={
                        transaction.type === "income"
                          ? "transaction-amount transaction-amount-income"
                          : "transaction-amount transaction-amount-expense"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </p>

                    <div className="transaction-item-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => startEditing(transaction)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger"
                        onClick={() => deleteTransaction(transaction.id)}
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
      </section>
    </main>
  );
}