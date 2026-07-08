import { useEffect, useState } from "react";
import api from "../api/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [error, setError] = useState("");

  async function fetchCategories() {
    try {
      const response = await api.get("/categories/");
      setCategories(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Could not load categories");
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function resetForm() {
    setFormData({
      name: "",
      type: "expense",
    });
    setEditingCategoryId(null);
  }

  function startEditing(category) {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      type: category.type,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, formData);
      } else {
        await api.post("/categories/", formData);
      }

      resetForm();
      await fetchCategories();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not save category");
    }
  }

  async function deleteCategory(categoryId) {
    try {
      await api.delete(`/categories/${categoryId}`);
      await fetchCategories();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not delete category");
    }
  }

  const incomeCategories = categories.filter(
    (category) => category.type === "income"
  );

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const mostRecentCategory = categories[categories.length - 1];

  return (
    <main className="page categories-page">
      <section className="categories-hero">
        <div>
          <span className="eyebrow">Category manager</span>
          <h1>Organize your money with clear categories</h1>
          <p>
            Create income and expense categories so every transaction has a
            place. Better categories mean better insights.
          </p>
        </div>

        <div className="categories-hero-card">
          <span>Current setup</span>
          <strong>{categories.length} categories</strong>
          <p>
            {categories.length === 0
              ? "Start by adding your first income or expense category."
              : "Your categories are ready to power transactions, budgets, and charts."}
          </p>
        </div>
      </section>

      <section className="categories-summary-grid">
        <div className="category-summary-card category-summary-card-income">
          <span>Income categories</span>
          <strong>{incomeCategories.length}</strong>
          <p>Examples: salary, freelance, gifts, business income.</p>
        </div>

        <div className="category-summary-card category-summary-card-expense">
          <span>Expense categories</span>
          <strong>{expenseCategories.length}</strong>
          <p>Examples: food, rent, transport, subscriptions.</p>
        </div>

        <div className="category-summary-card category-summary-card-total">
          <span>Total categories</span>
          <strong>{categories.length}</strong>
          <p>Used across your transactions, budgets, and dashboard.</p>
        </div>

        <div className="category-summary-card category-summary-card-latest">
          <span>Latest category</span>
          <strong>{mostRecentCategory ? mostRecentCategory.name : "None yet"}</strong>
          <p>
            {mostRecentCategory
              ? `Type: ${mostRecentCategory.type}`
              : "Create a category to start organizing your data."}
          </p>
        </div>
      </section>

      <section className="categories-layout-grid">
        <div className="card category-form-card">
          <div className="category-card-header">
            <div>
              <h2>{editingCategoryId ? "Edit category" : "Create category"}</h2>
              <p>
                {editingCategoryId
                  ? "Update the name or type of this category."
                  : "Add a new category for income or expense tracking."}
              </p>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Category name</label>
              <input
                name="name"
                placeholder="Food"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="category-form-tip">
              <strong>Tip</strong>
              <p>
                Keep category names simple. You will use them later when adding
                transactions and monthly budgets.
              </p>
            </div>

            <div className="actions">
              <button className="btn" type="submit">
                {editingCategoryId ? "Update category" : "Add category"}
              </button>

              {editingCategoryId && (
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

        <div className="card category-list-card">
          <div className="category-card-header">
            <div>
              <h2>Your categories</h2>
              <p>Manage the structure behind your financial dashboard.</p>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="category-empty-state">
              <h3>No categories yet</h3>
              <p>
                Add your first category to start creating transactions and
                budgets.
              </p>
            </div>
          ) : (
            <div className="category-card-list">
              {categories.map((category) => (
                <div className="category-item-card" key={category.id}>
                  <div className="category-item-main">
                    <div
                      className={
                        category.type === "income"
                          ? "category-icon category-icon-income"
                          : "category-icon category-icon-expense"
                      }
                    >
                      {category.type === "income" ? "↑" : "↓"}
                    </div>

                    <div>
                      <strong>{category.name}</strong>
                      <span
                        className={
                          category.type === "income"
                            ? "category-type-pill category-type-pill-income"
                            : "category-type-pill category-type-pill-expense"
                        }
                      >
                        {category.type}
                      </span>
                    </div>
                  </div>

                  <div className="category-item-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => startEditing(category)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => deleteCategory(category.id)}
                    >
                      Delete
                    </button>
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