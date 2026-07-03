import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");

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
      await api.post("/auth/register", formData);
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.detail || "Registration failed");
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Create your account</h1>
        <p>Start tracking your income, expenses, budgets, and categories.</p>
      </div>

      <div className="card">
        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Name</label>
              <input
                name="name"
                placeholder="John"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Surname</label>
              <input
                name="surname"
                placeholder="Paul"
                value={formData.surname}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <label>Username</label>
            <input
              name="username"
              placeholder="johnpaul"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input
              name="email"
              placeholder="john@example.com"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              name="password"
              placeholder="Your password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button className="btn" type="submit">
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}