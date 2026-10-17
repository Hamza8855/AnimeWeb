"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

const PAGE_SIZE = 10;

const emptyForm = {
  name: "",
  description: "",
};

export default function AdminCategoriesPage() {
  const { success, error: showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // FETCH CATEGORIES FROM DATABASE
  const loadCategories = useCallback(
    async (notify = true) => {
      setLoading(true);
      setError("");

      try {
        const result = await apiFetch("/api/admin/categories", {
          method: "GET",
        });

        if (!result.success) {
          throw new Error(result.data?.message || "Unable to load categories.");
        }

        const fetchedCategories = result.data?.categories;

        if (!Array.isArray(fetchedCategories)) {
          throw new Error("Invalid categories response from the server.");
        }

        setCategories(fetchedCategories);
      } catch (err) {
        console.error("Admin categories load error:", err);

        setError("We couldn't load categories. Please try again.");

        if (notify) {
          showError("We couldn't load categories. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // GENERATE SLUG
  const createSlug = (name) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // INPUT CHANGE
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // OPEN CREATE FORM
  const handleOpenCreate = () => {
    setEditingCategoryId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // OPEN EDIT FORM
  const handleEdit = (category) => {
    setEditingCategoryId(category._id);

    setForm({
      name: category.name || "",
      description: category.description || "",
    });

    setError("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // CLOSE FORM
  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCategoryId(null);
    setForm(emptyForm);
  };

  // CREATE OR UPDATE CATEGORY
  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    const slug = createSlug(name);

    if (name.length < 2 || name.length > 50) {
      showError("Category name must be between 2 and 50 characters.");
      return;
    }

    if (!slug) {
      showError(
        "Please use an English category name so a valid slug can be generated.",
      );
      return;
    }

    if (description.length > 300) {
      showError("Description cannot exceed 300 characters.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingCategoryId !== null;

      const endpoint = isEditing
        ? `/api/admin/categories/${editingCategoryId}`
        : "/api/admin/categories";

      const result = await apiFetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          description,
        }),
      });

      if (!result.success) {
        throw new Error(result.data?.message || "Unable to save category.");
      }

      handleCloseForm();
      setCurrentPage(1);

      success(
        isEditing
          ? "Category updated successfully."
          : "Category created successfully.",
      );

      await loadCategories(false);
    } catch (err) {
      console.error("Admin category save error:", err);

      showError(
        err.message || "We couldn't save the category. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE CATEGORY
  const handleDelete = async (category) => {
    if (deletingId) return;

    const videoCount = category.videoCount || 0;

    const confirmed = window.confirm(
      videoCount > 0
        ? `${category.name} has ${videoCount} linked videos. The backend may prevent deletion while videos are linked. Continue?`
        : `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(category._id);

    try {
      const result = await apiFetch(`/api/admin/categories/${category._id}`, {
        method: "DELETE",
      });

      if (!result.success) {
        throw new Error(result.data?.message || "Unable to delete category.");
      }

      success("Category deleted successfully.");

      await loadCategories(false);
    } catch (err) {
      console.error("Admin category delete error:", err);

      showError(
        err.message || "We couldn't delete the category. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // SEARCH FILTER
  const filteredCategories = categories.filter((category) => {
    const query = search.trim().toLowerCase();

    return (
      category.name?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query) ||
      category.slug?.toLowerCase().includes(query)
    );
  });

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const firstItem = filteredCategories.length === 0 ? 0 : startIndex + 1;

  const lastItem = Math.min(startIndex + PAGE_SIZE, filteredCategories.length);

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString();
  };

  return (
    <main className="min-h-screen min-w-0 bg-black text-white">
      <section className="min-w-0 p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex text-sm font-medium text-gray-400 transition hover:text-red-500"
            >
              ← Back to Dashboard
            </Link>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              Admin Panel
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Category Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">
              Create, edit and manage categories for your anime videos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            + Create Category
          </button>
        </div>

        {/* LOAD ERROR WITH RETRY */}
        {!loading && error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-5"
          >
            <p className="text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={() => loadCategories()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* CREATE / EDIT FORM */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {editingCategoryId ? "Edit Category" : "Create New Category"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter category information below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Category Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Characters"
                  minLength={2}
                  maxLength={50}
                  required
                  className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-red-500"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Slug: {createSlug(form.name) || "Enter a category name"}
                </p>
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={300}
                  placeholder="Enter category description"
                  className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-red-500"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCategoryId
                      ? "Update Category"
                      : "Create Category"}
                </button>

                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="rounded-lg border border-white/10 px-6 py-3 font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SEARCH AND COUNT */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">All Categories</h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your database categories.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search categories..."
              className="min-w-0 rounded-lg border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-red-500"
            />

            <span className="rounded-full bg-white/5 px-4 py-2.5 text-center text-sm text-gray-400">
              {filteredCategories.length} Categories
            </span>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-xl border border-white/10 bg-zinc-950 px-6 py-16 text-center text-gray-400">
            Loading categories...
          </div>
        )}

        {/* DESKTOP TABLE */}
        {!loading && paginatedCategories.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-zinc-950 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-400">
                      Category
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-400">
                      Description
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-400">
                      Videos
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-400">
                      Created
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCategories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600 font-bold">
                            {category.name?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <h3 className="font-semibold text-white">
                              {category.name}
                            </h3>
                            <p className="mt-1 text-xs text-gray-600">
                              Slug: {category.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-md px-5 py-5">
                        <p className="line-clamp-2 text-sm leading-6 text-gray-500">
                          {category.description || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">
                          {category.videoCount ?? 0} Videos
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-500">
                        {formatDate(category.createdAt)}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={Boolean(deletingId)}
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId === category._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MOBILE CARDS */}
        {!loading && paginatedCategories.length > 0 && (
          <div className="space-y-4 md:hidden">
            {paginatedCategories.map((category) => (
              <article
                key={category._id}
                className="rounded-xl border border-white/10 bg-zinc-950 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-600 font-bold">
                    {category.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{category.name}</h3>

                    <p className="mt-1 break-words text-xs text-gray-500">
                      Slug: {category.slug}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {category.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-500">
                  <span>{category.videoCount ?? 0} Videos</span>
                  <span>•</span>
                  <span>{formatDate(category.createdAt)}</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={Boolean(deletingId)}
                    className="rounded-lg border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {deletingId === category._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950 px-6 py-16 text-center">
            <h3 className="text-xl font-bold">
              {categories.length === 0
                ? "No Categories Yet"
                : "No Categories Found"}
            </h3>

            <p className="mt-2 text-gray-500">
              {categories.length === 0
                ? "Create your first category to get started."
                : "Try another search or create a new category."}
            </p>

            {categories.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                + Create First Category
              </button>
            )}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredCategories.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-gray-400 sm:text-left">
              Showing{" "}
              <span className="font-semibold text-white">{firstItem}</span>
              {"–"}
              <span className="font-semibold text-white">{lastItem}</span>
              {" of "}
              <span className="font-semibold text-white">
                {filteredCategories.length}
              </span>
              {" categories"}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <span className="whitespace-nowrap text-sm text-gray-400">
                Page <span className="font-bold text-white">{currentPage}</span>
                {" of "}
                <span className="font-bold text-white">{totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
