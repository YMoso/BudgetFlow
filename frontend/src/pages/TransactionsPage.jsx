import { useEffect, useState } from "react";
import api from "../api/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    type: "expense",
    transaction_date: "",
    category_id: "",
  });
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [error, setError] = useState("");

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
      transaction_date: "",
      category_id: "",
    });
    setEditingTransactionId(null);
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

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
      } else {
        await api.post("/transactions/", payload);
      }

      resetForm();
      fetchTransactions();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not save transaction");
    }
  }

  async function deleteTransaction(transactionId) {
    try {
      await api.delete(`/transactions/${transactionId}`);
      fetchTransactions();
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

  return (
    <main className="page">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Add and manage income and expense transactions.</p>
      </div>

      <div className="card">
        {error && <p className="error">{error}</p>}

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
              <select name="type" value={formData.type} onChange={handleChange}>
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

      <div className="card">
        <h2>Your transactions</h2>

        {transactions.length === 0 ? (
          <p className="empty-message">No transactions yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.transaction_date}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.amount}</td>
                    <td>{transaction.type}</td>
                    <td>{getCategoryName(transaction.category_id)}</td>
                    <td>
                      <div className="actions">
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