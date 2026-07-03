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
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/transactions/", {
        amount: Number(formData.amount),
        description: formData.description,
        type: formData.type,
        transaction_date: formData.transaction_date,
        category_id: Number(formData.category_id),
      });

      setFormData({
        amount: "",
        description: "",
        type: "expense",
        transaction_date: "",
        category_id: "",
      });

      fetchTransactions();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not create transaction");
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

  const filteredCategories = categories.filter(
    (category) => category.type === formData.type
  );

  return (
    <div>
      <h1>Transactions</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="amount"
          placeholder="Amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
        />

        <input
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          name="transaction_date"
          type="date"
          value={formData.transaction_date}
          onChange={handleChange}
        />

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

        <button type="submit">Add transaction</button>
      </form>

      <h2>Your transactions</h2>

      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              {transaction.transaction_date} — {transaction.description} —{" "}
              {transaction.amount} — {transaction.type}{" "}
              <button onClick={() => deleteTransaction(transaction.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}