import { useEffect, useState } from "react";
import api from "../api/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/categories/", formData);
      setFormData({
        name: "",
        type: "expense",
      });
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.detail || "Could not create category");
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
    <div>
      <h1>Categories</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Category name"
          value={formData.name}
          onChange={handleChange}
        />

        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <button type="submit">Add category</button>
      </form>

      <h2>Your categories</h2>

      {categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              {category.name} — {category.type}{" "}
              <button onClick={() => deleteCategory(category.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}