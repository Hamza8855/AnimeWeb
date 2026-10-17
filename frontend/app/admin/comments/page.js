"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

const PAGE_SIZE = 10;

function getCommentFields(comment) {
  return {
    id: comment._id,
    username:
      comment.user?.username ||
      comment.user?.name ||
      comment.authorName ||
      "Guest",
    text: comment.text || "",
    video: comment.video?.title || "Unknown video",
    date: comment.createdAt
      ? new Date(comment.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Unknown date",
    status: comment.status || "visible",
  };
}

export default function AdminCommentsPage() {
  const { success, error: showError } = useToast();

  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  // Fetch real comments from the backend.
  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiFetch("/api/comments?admin=true", {
        method: "GET",
        credentials: "include",
      });

      const data = result?.data;

      if (!result?.success || !data?.success) {
        throw new Error(
          data?.message || "Unable to load comments. Please try again.",
        );
      }

      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      console.error("Load Admin Comments Error:", err);

      setError("We couldn't load comments. Please try again.");
      showError("We couldn't load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Search comments.
  const filteredComments = comments.filter((item) => {
    const comment = getCommentFields(item);
    const searchText = search.trim().toLowerCase();

    return (
      comment.username.toLowerCase().includes(searchText) ||
      comment.text.toLowerCase().includes(searchText) ||
      comment.video.toLowerCase().includes(searchText)
    );
  });

  // Pagination calculations.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredComments.length / PAGE_SIZE),
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedComments = filteredComments.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const firstComment = filteredComments.length === 0 ? 0 : startIndex + 1;

  const lastComment = Math.min(startIndex + PAGE_SIZE, filteredComments.length);

  // Reset to page 1 when search changes.
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  // Correct the current page after comments are deleted or filtered.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Hide or restore a comment through the backend.
  const handleToggleVisibility = async (comment) => {
    if (!comment?._id || comment.status === "deleted" || pendingId) {
      return;
    }

    const nextStatus = comment.status === "hidden" ? "visible" : "hidden";

    setPendingId(comment._id);
    setError("");

    try {
      const result = await apiFetch(`/api/comments/${comment._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!result?.success || !result?.data?.success) {
        throw new Error(
          result?.data?.message || "Unable to update comment status.",
        );
      }

      setComments((previous) =>
        previous.map((item) =>
          item._id === comment._id ? { ...item, status: nextStatus } : item,
        ),
      );

      success(
        nextStatus === "hidden"
          ? "Comment hidden successfully."
          : "Comment restored successfully.",
      );
    } catch (err) {
      console.error("Update Comment Status Error:", err);

      showError("We couldn't update this comment. Please try again.");
    } finally {
      setPendingId(null);
    }
  };

  // Permanently delete a comment through the backend.
  const handleDelete = async (comment) => {
    if (!comment?._id || pendingId) return;

    const author =
      comment.user?.username ||
      comment.user?.name ||
      comment.authorName ||
      "Guest";

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the comment by ${author}?`,
    );

    if (!confirmed) return;

    setPendingId(comment._id);
    setError("");

    try {
      const result = await apiFetch(`/api/comments/${comment._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!result?.success || !result?.data?.success) {
        throw new Error(result?.data?.message || "Unable to delete comment.");
      }

      setComments((previous) =>
        previous.filter((item) => item._id !== comment._id),
      );

      success("Comment deleted successfully.");
    } catch (err) {
      console.error("Delete Comment Error:", err);

      showError("We couldn't delete this comment. Please try again.");
    } finally {
      setPendingId(null);
    }
  };

  const visibleCount = comments.filter(
    (comment) => comment.status === "visible",
  ).length;

  const hiddenCount = comments.filter(
    (comment) => comment.status === "hidden",
  ).length;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
            Admin Panel
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Comment Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Manage guest and registered-user comments posted on your videos.
          </p>
        </div>

        {/* Load error with retry */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={loadComments}
              disabled={loading}
              className="mt-3 rounded-lg border border-red-500/40 px-3 py-2 font-medium hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Try Again"}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-5">
            <p className="text-sm text-gray-500">Total Comments</p>
            <p className="mt-2 text-3xl font-bold">{comments.length}</p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-5">
            <p className="text-sm text-gray-500">Visible Comments</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {visibleCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-5">
            <p className="text-sm text-gray-500">Hidden Comments</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {hiddenCount}
            </p>
          </div>
        </div>

        {/* Search and Refresh */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search username, comment or video..."
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-5 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
          />

          <button
            type="button"
            onClick={loadComments}
            disabled={loading || Boolean(pendingId)}
            className="rounded-xl border border-gray-700 px-5 py-3 text-sm font-semibold transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div
            role="status"
            className="rounded-xl border border-gray-800 bg-gray-950 px-6 py-16 text-center"
          >
            <p className="text-gray-300">Loading comments...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-800 bg-gray-950 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b border-gray-800 bg-gray-900/70">
                    <tr>
                      {[
                        "Username",
                        "Comment",
                        "Video",
                        "Date",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-6 py-4 text-sm font-semibold text-gray-300 ${
                            heading === "Actions" ? "text-right" : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-800">
                    {paginatedComments.map((item) => {
                      const comment = getCommentFields(item);
                      const busy = pendingId === item._id;

                      return (
                        <tr
                          key={comment.id}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/10 font-semibold text-red-500">
                                {comment.username.charAt(0).toUpperCase()}
                              </div>

                              <span className="font-medium">
                                {comment.username}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-sm px-6 py-5">
                            <p className="line-clamp-2 text-sm leading-6 text-gray-400">
                              {comment.text}
                            </p>
                          </td>

                          <td className="max-w-xs px-6 py-5">
                            <p className="line-clamp-2 text-sm text-gray-400">
                              {comment.video}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                            {comment.date}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                comment.status === "visible"
                                  ? "bg-green-500/10 text-green-400"
                                  : comment.status === "hidden"
                                    ? "bg-yellow-500/10 text-yellow-400"
                                    : "bg-gray-700 text-gray-300"
                              }`}
                            >
                              {comment.status}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  Boolean(pendingId) ||
                                  comment.status === "deleted"
                                }
                                onClick={() => handleToggleVisibility(item)}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                  comment.status === "hidden"
                                    ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                                    : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                                }`}
                              >
                                {busy
                                  ? "Saving..."
                                  : comment.status === "hidden"
                                    ? "Show"
                                    : "Hide"}
                              </button>

                              <button
                                type="button"
                                disabled={busy || Boolean(pendingId)}
                                onClick={() => handleDelete(item)}
                                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {busy ? "Please wait..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 lg:hidden">
              {paginatedComments.map((item) => {
                const comment = getCommentFields(item);
                const busy = pendingId === item._id;

                return (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-red-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600/10 font-semibold text-red-500">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold">{comment.username}</p>
                        <p className="mt-1 text-xs text-gray-600">
                          {comment.date}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Comment
                      </p>
                      <p className="mt-2 break-words text-sm leading-6 text-gray-400">
                        {comment.text}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Video
                      </p>
                      <p className="mt-2 text-sm text-gray-400">
                        {comment.video}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Status
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          comment.status === "visible"
                            ? "bg-green-500/10 text-green-400"
                            : comment.status === "hidden"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                      <button
                        type="button"
                        disabled={
                          busy ||
                          Boolean(pendingId) ||
                          comment.status === "deleted"
                        }
                        onClick={() => handleToggleVisibility(item)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          comment.status === "hidden"
                            ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                            : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        }`}
                      >
                        {busy
                          ? "Saving..."
                          : comment.status === "hidden"
                            ? "Show Comment"
                            : "Hide Comment"}
                      </button>

                      <button
                        type="button"
                        disabled={busy || Boolean(pendingId)}
                        onClick={() => handleDelete(item)}
                        className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? "Please wait..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {!error && filteredComments.length === 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-950 px-6 py-16 text-center">
                <h2 className="text-xl font-bold">No Comments Found</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {comments.length === 0
                    ? "No comments have been found in the database."
                    : "Try searching with another username, comment or video."}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredComments.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {firstComment}-{lastComment}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {filteredComments.length}
                  </span>{" "}
                  comments
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-2 text-sm text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
