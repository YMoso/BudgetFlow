import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post(
        "/auth/token",
        new URLSearchParams({
          username,
          password,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      localStorage.setItem("access_token", response.data.access_token);
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.detail || "Login failed");
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Welcome back</h1>
        <p>Login to manage your BudgetFlow dashboard.</p>
      </div>

      <div className="card">
        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Username</label>
            <input
              placeholder="johnpaul"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              placeholder="Your password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button className="btn" type="submit">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}