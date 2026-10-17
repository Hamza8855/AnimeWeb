"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

const PAGE_SIZE = 10;

const emptyForm = {
  title: "",
  description: "",
  youtubeUrl: "",
  thumbnailUrl: "",
  category: "",
  featured: false,
  published: true,
};

function getYouTubeId(url) {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (
      ![
        "youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtube-nocookie.com",
      ].includes(host)
    ) {
      return "";
    }

    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    const match = parsedUrl.pathname.match(
      /^\/(?:embed|shorts|live)\/([^/?]+)/,
    );

    return match?.[1] || "";
  } catch {
    return "";
  }
}

function getVideoId(video) {
  return video?._id || video?.id || "";
}

function getCategoryId(video) {
  const category = video?.category;

  if (typeof category === "string") return category;

  return category?._id || category?.id || "";
}

function getCategoryName(video) {
  if (typeof video?.category === "string") {
    return video.category;
  }

  return video?.category?.name || "Uncategorized";
}

function getThumbnail(video) {
  if (video?.thumbnail) return video.thumbnail;
  if (video?.thumbnailUrl) return video.thumbnailUrl;

  const youtubeId = video?.youtubeId || getYouTubeId(video?.youtubeUrl);

  return youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
    : "/images/anime-1.jpg";
}

function getErrorMessage(result, fallback) {
  return result?.data?.message || result?.message || fallback;
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-red-500";

const secondaryButtonClass =
  "rounded-lg border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

export default function AdminVideosPage() {
  const { success, error: showError } = useToast();

  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: PAGE_SIZE,
    totalVideos: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");

  // Load videos and categories from the backend.
  const loadData = useCallback(async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const [videoResult, categoryResult] = await Promise.all([
        apiFetch(`/api/admin/videos?${params.toString()}`),
        apiFetch("/api/admin/categories?status=active"),
      ]);

      if (!videoResult.success) {
        throw new Error(getErrorMessage(videoResult, "Unable to load videos."));
      }

      if (!categoryResult.success) {
        throw new Error(
          getErrorMessage(categoryResult, "Unable to load categories."),
        );
      }

      const videoData = videoResult.data || {};
      const fetchedVideos = videoData.videos || [];
      const pageInfo = videoData.pagination;

      setVideos(fetchedVideos);
      setCategories(categoryResult.data?.categories || []);

      if (pageInfo) {
        setPagination(pageInfo);
        setCurrentPage(pageInfo.currentPage);
      } else {
        setPagination({
          currentPage: page,
          limit: PAGE_SIZE,
          totalVideos: fetchedVideos.length,
          totalPages: fetchedVideos.length ? 1 : 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err.message || "Unable to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Search changes load the first page after a short delay.
  // This also handles the initial load without duplicate requests.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadData(1, search);
      },
      search ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [search, loadData]);

  function openAddForm() {
    setEditingVideoId(null);
    setForm({
      ...emptyForm,
      category: categories[0]?._id || categories[0]?.id || "",
    });
    setError("");
    setShowForm(true);
  }

  function openEditForm(video) {
    setEditingVideoId(getVideoId(video));

    setForm({
      title: video?.title || "",
      description: video?.description || "",
      youtubeUrl: video?.youtubeUrl || "",
      thumbnailUrl: video?.thumbnail || video?.thumbnailUrl || "",
      category: getCategoryId(video),
      featured: Boolean(video?.isFeatured ?? video?.featured),
      published:
        (video?.status || (video?.published ? "published" : "draft")) ===
        "published",
    });

    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingVideoId(null);
    setForm(emptyForm);
  }

  function handleFormChange(event) {
    const { name, value, checked, type } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    const youtubeUrl = form.youtubeUrl.trim();
    const youtubeId = getYouTubeId(youtubeUrl);

    if (title.length < 2) {
      showError("Video title must contain at least 2 characters.");
      return;
    }

    if (!youtubeId) {
      showError("Please enter a valid YouTube video URL.");
      return;
    }

    if (!form.category) {
      showError("Please select a category.");
      return;
    }

    const thumbnail =
      form.thumbnailUrl.trim() ||
      `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    const wasEditing = Boolean(editingVideoId);

    const payload = {
      title,
      description: form.description.trim(),
      youtubeId,
      youtubeUrl,
      thumbnail,
      category: form.category,
      status: form.published ? "published" : "draft",
      isFeatured: form.featured,
    };

    setSaving(true);

    try {
      const endpoint = wasEditing
        ? `/api/admin/videos/${editingVideoId}`
        : "/api/admin/videos";

      const result = await apiFetch(endpoint, {
        method: wasEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (!result.success) {
        throw new Error(getErrorMessage(result, "Unable to save this video."));
      }

      closeForm();

      success(
        wasEditing
          ? "Video updated successfully."
          : "Video added successfully.",
      );

      await loadData(currentPage, search);
    } catch (err) {
      showError(err.message || "Unable to save this video.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(video) {
    const id = getVideoId(video);

    if (!id) {
      showError("Unable to identify this video.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${video.title || "this video"}"?`,
    );

    if (!confirmed) return;

    setActionId(id);

    try {
      const result = await apiFetch(`/api/admin/videos/${id}`, {
        method: "DELETE",
      });

      if (!result.success) {
        throw new Error(
          getErrorMessage(result, "Unable to delete this video."),
        );
      }

      success("Video deleted successfully.");

      const pageToLoad =
        videos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      await loadData(pageToLoad, search);
    } catch (err) {
      showError(err.message || "Unable to delete this video.");
    } finally {
      setActionId(null);
    }
  }

  async function handleAction(video, action) {
    const id = getVideoId(video);

    if (!id) {
      showError("Unable to identify this video.");
      return;
    }

    setActionId(id);

    try {
      const result = await apiFetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });

      if (!result.success) {
        throw new Error(
          getErrorMessage(result, "Unable to update this video."),
        );
      }

      const messages = {
        publish: "Video published successfully.",
        unpublish: "Video moved to drafts successfully.",
        feature: "Video added to featured videos.",
        unfeature: "Video removed from featured videos.",
      };

      success(messages[action] || "Video updated successfully.");

      await loadData(currentPage, search);
    } catch (err) {
      showError(err.message || "Unable to update this video.");
    } finally {
      setActionId(null);
    }
  }

  async function goToPage(page) {
    if (loading || page < 1 || page > pagination.totalPages) return;

    await loadData(page, search);
  }

  const startVideo =
    pagination.totalVideos === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endVideo = Math.min(currentPage * PAGE_SIZE, pagination.totalVideos);

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">
            Content Management
          </p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Videos Management
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Add, edit, publish and manage your anime videos.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        >
          + Add New Video
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadData(currentPage, search)}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4 sm:p-5">
        <label
          htmlFor="video-search"
          className="mb-2 block text-sm font-semibold text-gray-300"
        >
          Search videos
        </label>

        <input
          id="video-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, description or category..."
          className={inputClass}
        />

        <p className="mt-2 text-xs text-gray-500">
          Search results are loaded from the server and paginated by 10.
        </p>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-red-500/30 bg-zinc-950 p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white">
              {editingVideoId ? "Edit Video" : "Add New Video"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className={secondaryButtonClass}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="video-title"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Video Title *
                </label>
                <input
                  id="video-title"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  maxLength={150}
                  className={inputClass}
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="youtube-url"
                  className="mb-2 block text-sm text-gray-300"
                >
                  YouTube URL *
                </label>
                <input
                  id="youtube-url"
                  name="youtubeUrl"
                  type="url"
                  value={form.youtubeUrl}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />

                {getYouTubeId(form.youtubeUrl) && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(form.youtubeUrl)}/hqdefault.jpg`}
                      alt="YouTube thumbnail preview"
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="video-category"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Category *
                </label>
                <select
                  id="video-category"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className={inputClass}
                  required
                  disabled={categories.length === 0}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={category._id || category.id}
                      value={category._id || category.id}
                      className="bg-zinc-950"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                {categories.length === 0 && !loading && (
                  <p className="mt-2 text-sm text-yellow-500">
                    No active categories available. Create or activate a
                    category in Category Management first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="thumbnail-url"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Thumbnail URL (optional)
                </label>
                <input
                  id="thumbnail-url"
                  name="thumbnailUrl"
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="video-description"
                className="mb-2 block text-sm text-gray-300"
              >
                Description
              </label>
              <textarea
                id="video-description"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className={`${inputClass} min-h-28 resize-y`}
                placeholder="Enter video description"
                rows={4}
                maxLength={5000}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleFormChange}
                  className="accent-red-600"
                />
                Publish video
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleFormChange}
                  className="accent-red-600"
                />
                Featured video
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving || categories.length === 0}
                className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingVideoId
                    ? "Update Video"
                    : "Add Video"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
        <div className="flex flex-col gap-2 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-white">All Videos</h2>
          <p className="text-xs text-gray-400">
            Showing {startVideo}–{endVideo} of {pagination.totalVideos}
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">
            <span className="inline-block animate-pulse">
              Loading videos...
            </span>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-white">No videos found</p>
            <p className="mt-2 text-sm text-gray-400">
              Try another search or add a new video.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-black/60 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-4">Video</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Featured</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {videos.map((video) => {
                    const id = getVideoId(video);
                    const isPublished =
                      (video.status ||
                        (video.published ? "published" : "draft")) ===
                      "published";
                    const isFeatured = Boolean(
                      video.isFeatured ?? video.featured,
                    );
                    const busy = actionId === id;

                    return (
                      <tr
                        key={id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex min-w-[240px] items-center gap-3">
                            <img
                              src={getThumbnail(video)}
                              alt={video.title || "Video thumbnail"}
                              className="h-16 w-24 rounded-lg border border-white/10 object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className="line-clamp-2 font-semibold text-white">
                                {video.title}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {video.views ?? 0} views
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-gray-300">
                          {getCategoryName(video)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isPublished
                                ? "bg-green-500/10 text-green-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={
                              isFeatured ? "text-yellow-400" : "text-gray-500"
                            }
                          >
                            {isFeatured ? "★ Featured" : "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={Boolean(actionId) || saving}
                              onClick={() => openEditForm(video)}
                              className={secondaryButtonClass}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={busy || Boolean(actionId)}
                              onClick={() =>
                                handleAction(
                                  video,
                                  isPublished ? "unpublish" : "publish",
                                )
                              }
                              className={secondaryButtonClass}
                            >
                              {isPublished ? "Unpublish" : "Publish"}
                            </button>

                            <button
                              type="button"
                              disabled={busy || Boolean(actionId)}
                              onClick={() =>
                                handleAction(
                                  video,
                                  isFeatured ? "unfeature" : "feature",
                                )
                              }
                              className={secondaryButtonClass}
                            >
                              {isFeatured ? "Unfeature" : "Feature"}
                            </button>

                            <button
                              type="button"
                              disabled={busy || Boolean(actionId)}
                              onClick={() => handleDelete(video)}
                              className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                            >
                              {busy ? "Please wait..." : "Delete"}
                            </button>

                            {video.youtubeUrl && (
                              <a
                                href={video.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={secondaryButtonClass}
                              >
                                YouTube
                              </a>
                            )}

                            <Link
                              href={`/videos/${id}`}
                              target="_blank"
                              className={secondaryButtonClass}
                            >
                              Website
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {videos.map((video) => {
                const id = getVideoId(video);
                const isPublished =
                  (video.status ||
                    (video.published ? "published" : "draft")) === "published";
                const isFeatured = Boolean(video.isFeatured ?? video.featured);
                const busy = actionId === id;

                return (
                  <article
                    key={id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black"
                  >
                    <div className="flex gap-3 p-3">
                      <img
                        src={getThumbnail(video)}
                        alt={video.title || "Video thumbnail"}
                        className="h-20 w-28 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-white">
                          {video.title}
                        </h3>
                        <p className="mt-1 text-xs text-gray-400">
                          {getCategoryName(video)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          <span
                            className={
                              isPublished ? "text-green-400" : "text-yellow-400"
                            }
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>
                          {isFeatured && (
                            <span className="text-yellow-400">★ Featured</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-white/10 p-3">
                      <button
                        type="button"
                        disabled={Boolean(actionId) || saving}
                        onClick={() => openEditForm(video)}
                        className={secondaryButtonClass}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={busy || Boolean(actionId)}
                        onClick={() =>
                          handleAction(
                            video,
                            isPublished ? "unpublish" : "publish",
                          )
                        }
                        className={secondaryButtonClass}
                      >
                        {isPublished ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        disabled={busy || Boolean(actionId)}
                        onClick={() =>
                          handleAction(
                            video,
                            isFeatured ? "unfeature" : "feature",
                          )
                        }
                        className={secondaryButtonClass}
                      >
                        {isFeatured ? "Unfeature" : "Feature"}
                      </button>

                      <button
                        type="button"
                        disabled={busy || Boolean(actionId)}
                        onClick={() => handleDelete(video)}
                        className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 disabled:opacity-40"
                      >
                        {busy ? "Please wait..." : "Delete"}
                      </button>

                      {video.youtubeUrl && (
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={secondaryButtonClass}
                        >
                          YouTube
                        </a>
                      )}

                      <Link
                        href={`/videos/${id}`}
                        target="_blank"
                        className={secondaryButtonClass}
                      >
                        View Website
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {!loading && pagination.totalVideos > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-semibold text-white">{startVideo}</span>
            {"–"}
            <span className="font-semibold text-white">{endVideo}</span>
            {" of "}
            <span className="font-semibold text-white">
              {pagination.totalVideos}
            </span>{" "}
            videos
            <p className="mt-1 text-xs text-gray-500">
              Page {currentPage} of {Math.max(pagination.totalPages, 1)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => goToPage(currentPage - 1)}
              className={secondaryButtonClass}
            >
              ← Previous
            </button>

            <span className="min-w-10 text-center text-sm font-semibold text-white">
              {currentPage}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => goToPage(currentPage + 1)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/dashboard"
          className="text-sm text-gray-400 transition hover:text-red-400"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
