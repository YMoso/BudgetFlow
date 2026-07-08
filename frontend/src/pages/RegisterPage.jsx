import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (
      !formData.name.trim() ||
      !formData.surname.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      return "Please fill in all fields.";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", formData);
      navigate("/login", { replace: true });
    } catch (error) {
      setError(error.response?.data?.detail || "Registration failed");
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
              <h1>Start building your finance system</h1>

              <p className="auth-lead">
                Create your account first, then organize your categories,
                transactions and monthly budgets step by step.
              </p>
            </div>

            <div className="card auth-form-card">
              <div className="auth-form-header">
                <h2>Create account</h2>
                <p>Enter your details to start your BudgetFlow setup.</p>
              </div>

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
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label>Surname</label>
                    <input
                      name="surname"
                      placeholder="Paul"
                      value={formData.surname}
                      onChange={handleChange}
                      required
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
                    required
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
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Password</label>

                  <div className="password-field">
                    <input
                      name="password"
                      placeholder="Create a password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      minLength="6"
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

                <button
                  className="btn auth-submit"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="auth-switch-text">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>

            <div className="auth-benefits">
              <span>Free forever</span>
              <span>No card required</span>
              <span>2-minute setup</span>
            </div>
          </div>
        </section>

        <section className="auth-preview register-preview">
          <div className="register-roadmap-card">
            <div className="roadmap-header">

              <h2>From account to insights</h2>

              <p>
                BudgetFlow guides you from a new account to a useful personal
                finance dashboard.
              </p>
            </div>

            <div className="roadmap-timeline">
              <div className="roadmap-step roadmap-step-active">
                <div className="roadmap-dot">1</div>

                <div>
                  <strong>Create your account</strong>
                  <span>Secure your workspace with your own login.</span>
                </div>
              </div>

              <div className="roadmap-step">
                <div className="roadmap-dot">2</div>

                <div>
                  <strong>Build your categories</strong>
                  <span>Separate income, food, rent, transport, and more.</span>
                </div>
              </div>

              <div className="roadmap-step">
                <div className="roadmap-dot">3</div>

                <div>
                  <strong>Add transactions</strong>
                  <span>Track what comes in and what goes out.</span>
                </div>
              </div>

              <div className="roadmap-step">
                <div className="roadmap-dot">4</div>

                <div>
                  <strong>Set monthly budgets</strong>
                  <span>Plan spending limits for important categories.</span>
                </div>
              </div>

              <div className="roadmap-step">
                <div className="roadmap-dot">5</div>

                <div>
                  <strong>Open your dashboard</strong>
                  <span>See balance, summaries, charts, and recent activity.</span>
                </div>
              </div>
            </div>

            <div className="roadmap-footer">
              <div>
                <span>Setup estimate</span>
                <strong>2–5 min</strong>
              </div>

              <div>
                <span>Best for</span>
                <strong>Personal budgeting</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}