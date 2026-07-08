import { useEffect, useState } from "react";
import api from "../api/api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [passwordData, setPasswordData] = useState({
    password: "",
    new_password: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProfile() {
    try {
      const response = await api.get("/user/");
      setUser(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load profile");
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function handleChange(event) {
    setPasswordData({
      ...passwordData,
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

  function validatePasswordForm() {
    if (!passwordData.password.trim() || !passwordData.new_password.trim()) {
      return "Please fill in both password fields.";
    }

    if (passwordData.new_password.length < 6) {
      return "New password must be at least 6 characters long.";
    }

    if (passwordData.password === passwordData.new_password) {
      return "New password must be different from your current password.";
    }

    return "";
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    clearMessages();

    const validationError = validatePasswordForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await api.put("/user/change-password", passwordData);

      setPasswordData({
        password: "",
        new_password: "",
      });

      showSuccess("Password changed successfully.");
    } catch (error) {
      setError(error.response?.data?.detail || "Could not change password");
    }
  }

  return (
    <main className="page profile-page">
      <section className="profile-hero">
        <div>
          <span className="eyebrow">Account settings</span>
          <h1>Manage your profile and security</h1>
          <p>
            Review your account details and update your password when needed.
            Keep your BudgetFlow workspace secure.
          </p>
        </div>

        <div className="profile-hero-card">
          <span>Account status</span>
          <strong>{user?.is_active ? "Active" : "Loading..."}</strong>
          <p>
            Your account is protected with authentication and connected to your
            personal financial data.
          </p>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}

      <section className="profile-layout-grid">
        <div className="card profile-details-card">
          <div className="profile-card-header">
            <div>
              <h2>Profile details</h2>
              <p>Your basic account information.</p>
            </div>
          </div>

          {!user ? (
            <p className="empty-message">Loading profile...</p>
          ) : (
            <div className="profile-detail-list">
              <div className="profile-detail-item">
                <span>Name</span>
                <strong>
                  {user.name} {user.surname}
                </strong>
              </div>

              <div className="profile-detail-item">
                <span>Username</span>
                <strong>{user.username}</strong>
              </div>

              <div className="profile-detail-item">
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>

              <div className="profile-detail-item">
                <span>Role</span>
                <strong>{user.role}</strong>
              </div>

              <div className="profile-detail-item">
                <span>Status</span>
                <strong>{user.is_active ? "Active" : "Inactive"}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="card profile-security-card">
          <div className="profile-card-header">
            <div>
              <h2>Change password</h2>
              <p>Use a strong password to keep your account safe.</p>
            </div>
          </div>

          <form className="form" onSubmit={handlePasswordSubmit}>
            <div className="form-row">
              <label>Current password</label>
              <input
                name="password"
                type="password"
                placeholder="Enter current password"
                value={passwordData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>New password</label>
              <input
                name="new_password"
                type="password"
                placeholder="Enter new password"
                value={passwordData.new_password}
                onChange={handleChange}
              />
            </div>

            <div className="profile-security-tip">
              <strong>Security tip</strong>
              <p>
                Use at least 6 characters. A longer password with letters,
                numbers, and symbols is safer.
              </p>
            </div>

            <button className="btn" type="submit">
              Change password
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}