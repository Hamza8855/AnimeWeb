"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://anime-web-wjdk.vercel.app";

const VIDEOS_PER_PAGE = 6;

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid server response");
  }

  return response.json();
}

function normalizeVideo(item) {
  const video = item?.video || item;

  if (!video || typeof video !== "object") {
    return null;
  }

  const id = video._id || video.id;

  if (!id) {
    return null;
  }

  return {
    ...video,
    _id: String(id),
    title: video.title || "Untitled Video",
    thumbnail:
      video.thumbnail ||
      video.thumbnailUrl ||
      video.image ||
      "/images/anime-1.jpg",
    category:
      typeof video.category === "object"
        ? video.category?.name || "Anime"
        : video.category || "Anime",
    views: video.views ?? 0,
  };
}

export default function SavedVideosPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const loadSavedVideos = useCallback(async () => {
    setLoading(true);

    try {
      const authResponse = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const authData = await readResponse(authResponse);

      if (!authResponse.ok || authData?.success === false) {
        router.replace("/login");
        return;
      }

      const user = authData?.user || authData?.data?.user || authData?.data;

      if (user?.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      const response = await fetch(`${API_URL}/api/saved-videos`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error("Unable to load saved videos");
      }

      const items = Array.isArray(data?.savedVideos)
        ? data.savedVideos
        : Array.isArray(data?.data?.savedVideos)
          ? data.data.savedVideos
          : [];

      setVideos(items.map(normalizeVideo).filter(Boolean));
      setCurrentPage(1);
    } catch {
      showError("We couldn't load your saved videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router, showError]);

  useEffect(() => {
    loadSavedVideos();
  }, [loadSavedVideos]);

  const handleUnsave = async (videoId) => {
    if (removingId) return;

    setRemovingId(videoId);

    try {
      const response = await fetch(`${API_URL}/api/saved-videos`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await readResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error("Unable to remove saved video");
      }

      const updatedVideos = videos.filter((video) => video._id !== videoId);

      setVideos(updatedVideos);

      const lastPage = Math.max(
        1,
        Math.ceil(updatedVideos.length / VIDEOS_PER_PAGE),
      );

      setCurrentPage((page) => Math.min(page, lastPage));

      success("Video removed from your saved videos.");
    } catch {
      showError("We couldn't update your saved videos. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(videos.length / VIDEOS_PER_PAGE));

  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;

  const visibleVideos = videos.slice(startIndex, startIndex + VIDEOS_PER_PAGE);

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/profile"
              className="mb-3 inline-flex text-sm text-zinc-400 transition hover:text-red-500"
            >
              ← Back to Profile
            </Link>

            <h1 className="text-3xl font-extrabold sm:text-4xl">
              <span className="text-red-600">Saved</span> Videos
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-base">
              All your saved anime videos in one place.
            </p>
          </div>

          <Link
            href="/profile/liked-videos"
            className="inline-flex w-fit items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:border-red-600 hover:text-red-500"
          >
            Liked Videos →
          </Link>
        </div>

        {loading ? (
          <div
            role="status"
            className="py-20 text-center text-sm text-zinc-400"
          >
            Loading your saved videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950 px-5 py-14 text-center sm:px-8 sm:py-16">
            <div aria-hidden="true" className="mb-4 text-5xl text-red-500">
              ♡
            </div>

            <h2 className="text-xl font-bold sm:text-2xl">
              No Saved Videos Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
              Videos you save will appear here so you can easily find and watch
              them later.
            </p>

            <Link
              href="/videos"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
            >
              Explore Videos
            </Link>

            <button
              type="button"
              onClick={loadSavedVideos}
              className="ml-3 mt-6 inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold transition hover:border-red-600"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Total saved videos:{" "}
                <span className="font-semibold text-white">
                  {videos.length}
                </span>
              </p>

              <button
                type="button"
                onClick={loadSavedVideos}
                disabled={loading}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-red-600 hover:text-white disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {visibleVideos.map((video) => (
                <article
                  key={video._id}
                  className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 transition hover:border-red-600/50"
                >
                  <Link href={`/videos/${video._id}`} className="group block">
                    <div className="relative aspect-video overflow-hidden bg-zinc-900">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/images/anime-1.jpg";
                        }}
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-xl opacity-0 transition group-hover:opacity-100">
                          ▶
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h2 className="line-clamp-2 break-words font-semibold transition group-hover:text-red-500">
                        {video.title}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span className="max-w-full truncate rounded-full bg-zinc-800 px-3 py-1">
                          {video.category}
                        </span>

                        <span>
                          {Number(video.views).toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => handleUnsave(video._id)}
                      disabled={removingId !== null}
                      className="w-full rounded-lg border border-red-600/40 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingId === video._id
                        ? "Removing..."
                        : "♡ Unsave Video"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Saved videos pagination"
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-red-600 text-white"
                          : "border border-white/10 hover:border-red-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
