"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function CommentSection({ videoId }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadComments = useCallback(async () => {
    if (!videoId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiFetch(
        `/api/comments?videoId=${encodeURIComponent(videoId)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!result.success) {
        throw new Error(result.data?.message || "Unable to load comments.");
      }

      setComments(result.data?.comments || []);
    } catch (err) {
      setError(err.message || "Unable to load comments.");
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = comment.trim();

    if (!text) {
      setError("Please enter a comment.");
      return;
    }

    if (!videoId) {
      setError("Video information is not available.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await apiFetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          text,
        }),
      });

      if (!result.success) {
        throw new Error(result.data?.message || "Unable to post your comment.");
      }

      setComment("");
      setNotice("Your comment was posted successfully.");

      await loadComments();
    } catch (err) {
      setError(err.message || "Unable to post your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto mt-12 w-full max-w-7xl px-6 pb-12 text-white lg:px-8">
      <div className="border-t border-gray-800 pt-8">
        <h2 className="mb-2 text-2xl font-bold">
          Comments
          <span className="ml-2 text-base font-normal text-gray-500">
            ({comments.length})
          </span>
        </h2>

        <p className="mb-6 text-sm text-gray-400">
          Share your thoughts about this video.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-white/10 bg-zinc-950 p-4 sm:p-5"
        >
          <label
            htmlFor="video-comment"
            className="mb-3 block text-sm font-medium text-gray-300"
          >
            Write a comment
          </label>

          <textarea
            id="video-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write your comment here..."
            rows={4}
            maxLength={1000}
            disabled={submitting || !videoId}
            className="w-full resize-y rounded-lg border border-white/10 bg-black p-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500">
              {comment.length}/1000 characters
            </span>

            <button
              type="submit"
              disabled={submitting || !videoId || !comment.trim()}
              className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-500/30 bg-green-950/20 p-4 text-sm text-green-300"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-gray-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-10 text-center">
            <p className="font-medium text-gray-300">No comments yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Be the first to share your thoughts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((item) => {
              const author =
                item.user?.username ||
                item.user?.name ||
                item.authorName ||
                "Guest";

              const createdAt = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : "";

              return (
                <article
                  key={item._id}
                  className="rounded-xl border border-white/10 bg-zinc-950 p-4 sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/20 font-bold text-red-400">
                      {author.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="break-words font-semibold text-white">
                          {author}
                        </p>

                        {createdAt && (
                          <time className="text-xs text-gray-500">
                            {createdAt}
                          </time>
                        )}
                      </div>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
