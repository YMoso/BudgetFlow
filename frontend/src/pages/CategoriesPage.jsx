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

    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, formData);
      } else {
        await api.post("/categories/", formData);
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not save category");
    }
  }

  async function deleteCategory(categoryId) {
    try {
      await api.delete(`/categories/${categoryId}`);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not delete category");
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Categories</h1>
        <p>Create and manage income and expense categories.</p>
      </div>

      <div className="card">
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

      <div className="card">
        <h2>Your categories</h2>

        {categories.length === 0 ? (
          <p className="empty-message">No categories yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.type}</td>
                    <td>
                      <div className="actions">
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