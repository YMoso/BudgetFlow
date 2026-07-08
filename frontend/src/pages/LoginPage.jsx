import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
  event.preventDefault();
  setError("");

  if (!username.trim() || !password.trim()) {
    setError("Please enter your username and password.");
    return;
  }

  setIsLoading(true);

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

    login(response.data.access_token);
    navigate("/dashboard", { replace: true });
  } catch (error) {
    setError(error.response?.data?.detail || "Login failed");
  } finally {
    setIsLoading(false);
  }
}

  return (
    <main className="auth-page auth-page-split">
      <div className="auth-hero auth-hero-wide">
        <section className="auth-panel">
          <div className="auth-card auth-card-large">
            <div className="auth-intro">
              <h1>Welcome back to BudgetFlow</h1>

              <p className="auth-lead">
                Track your spending, organize your categories and stay in
                control of your monthly budget with a clean financial dashboard.
              </p>

              <div className="auth-feature-list">
                <div className="auth-feature-item">
                  <span className="auth-feature-icon">✓</span>
                  <div>
                    <strong>Understand your money</strong>
                    <p>See income, expenses, balance, and budget usage clearly.</p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <span className="auth-feature-icon">✓</span>
                  <div>
                    <strong>Plan smarter budgets</strong>
                    <p>Create category budgets and check if you are on track.</p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <span className="auth-feature-icon">✓</span>
                  <div>
                    <strong>Build better habits</strong>
                    <p>Review recent transactions and improve your spending decisions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card auth-form-card">
              <div className="auth-form-header">
                <h2>Sign in</h2>
                <p>Enter your details to open your dashboard.</p>
              </div>

              {error && <p className="error">{error}</p>}

              <form className="form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>Username</label>
                  <input
                    placeholder="johnpaul"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Password</label>
                  <div className="password-field">
                    <input
                      placeholder="Your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button className="btn auth-submit" type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login to dashboard"}
                </button>
              </form>

              <p className="auth-switch-text">
                New to BudgetFlow? <Link to="/register">Create an account</Link>
              </p>
            </div>

            <div className="auth-benefits">
              <span>Secure login</span>
              <span>Budget insights</span>
              <span>Clean dashboard</span>
            </div>
          </div>
        </section>

        <section className="auth-preview auth-preview-pro">
          <div className="floating-note floating-note-top">
            <span>Monthly savings</span>
            <strong>+€420</strong>
          </div>

          <div className="preview-card preview-card-light preview-card-pro">
            <div className="preview-card-header">
              <div>
                <p className="preview-label">Financial overview</p>
                <h2>€2,850 balance</h2>
              </div>

              <span className="preview-pill preview-pill-success">Healthy</span>
            </div>

            <div className="mini-stats">
              <div>
                <span>Income</span>
                <strong>€3,000</strong>
              </div>
              <div>
                <span>Expenses</span>
                <strong>€850</strong>
              </div>
            </div>

            <div className="preview-bars">
              <div>
                <div className="preview-bar-label">
                  <span>Budget used</span>
                  <strong>63%</strong>
                </div>
                <div className="preview-bar">
                  <div className="preview-bar-fill preview-bar-budget" />
                </div>
              </div>
            </div>

            <div className="preview-list">
              <div>
                <span>Food</span>
                <strong>€450</strong>
              </div>
              <div>
                <span>Transport</span>
                <strong>€180</strong>
              </div>
              <div>
                <span>Subscriptions</span>
                <strong>€65</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}