"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://anime-web-wjdk.vercel.app";

export default function VideoCard({ video }) {
  const videoId = video?._id || video?.id;

  const { success, error: showError, info } = useToast();

  const categoryName =
    typeof video?.category === "object"
      ? video.category?.name || "Uncategorized"
      : video?.category || "Uncategorized";

  const thumbnail = video?.thumbnail || video?.image || "/images/anime-1.jpg";

  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const [savedLoading, setSavedLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Load current user's like/save status.
  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    async function loadVideoStatus() {
      try {
        const [authResponse, likesResponse, savedResponse] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/likes`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/saved-videos`, {
            credentials: "include",
          }),
        ]);

        if (!authResponse.ok || !likesResponse.ok || !savedResponse.ok) {
          return;
        }

        const [authData, likesData, savedData] = await Promise.all([
          authResponse.json(),
          likesResponse.json(),
          savedResponse.json(),
        ]);

        if (cancelled) return;

        const user = authData?.user || authData?.data?.user;

        if (!authData?.success || !user) return;

        const likedVideos =
          likesData?.likedVideos || likesData?.data?.likedVideos || [];

        const savedVideos =
          savedData?.savedVideos || savedData?.data?.savedVideos || [];

        const matchesVideo = (item) => {
          const itemVideo = item?.video || item;
          const itemId = itemVideo?._id || itemVideo?.id;

          return itemId && String(itemId) === String(videoId);
        };

        setIsLiked(likedVideos.some(matchesVideo));
        setIsSaved(savedVideos.some(matchesVideo));
      } catch (err) {
        // Status loading is silent to avoid repeated card notifications.
        console.error("Video status loading failed:", err);
      }
    }

    loadVideoStatus();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Like or unlike video.
  async function handleLikeVideo() {
    if (likeLoading || !videoId) return;

    setLikeLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/likes`, {
        method: isLiked ? "DELETE" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: String(videoId),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        info("Please log in to like videos.");
        return;
      }

      if (!response.ok || !data.success) {
        showError("We couldn't update your like. Please try again.");
        return;
      }

      const liked = typeof data.liked === "boolean" ? data.liked : !isLiked;

      setIsLiked(liked);

      success(
        liked
          ? "Video added to your liked videos."
          : "Video removed from your liked videos.",
      );
    } catch (err) {
      console.error("Like video request failed:", err);
      showError("Unable to connect. Please try again.");
    } finally {
      setLikeLoading(false);
    }
  }

  // Save or unsave video.
  async function handleSaveVideo() {
    if (savedLoading || !videoId) return;

    setSavedLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/saved-videos`, {
        method: isSaved ? "DELETE" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: String(videoId),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        info("Please log in to save videos.");
        return;
      }

      if (!response.ok || !data.success) {
        showError("We couldn't update your saved videos. Please try again.");
        return;
      }

      const saved = typeof data.saved === "boolean" ? data.saved : !isSaved;

      setIsSaved(saved);

      success(
        saved
          ? "Video added to your saved videos."
          : "Video removed from your saved videos.",
      );
    } catch (err) {
      console.error("Save video request failed:", err);
      showError("Unable to connect. Please try again.");
    } finally {
      setSavedLoading(false);
    }
  }

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 transition-colors duration-300 hover:border-red-500/40">
      {/* Thumbnail */}
      <Link href={`/videos/${videoId}`}>
        <div className="relative aspect-video overflow-hidden bg-zinc-900">
          <img
            src={thumbnail}
            alt={video?.title || "Anime video"}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition duration-300 group-hover:opacity-100">
              ▶
            </div>
          </div>
        </div>
      </Link>

      {/* Video Information */}
      <div className="p-3 sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
          {categoryName}
        </p>

        <Link href={`/videos/${videoId}`}>
          <h3 className="mt-2 line-clamp-2 break-words text-base font-semibold leading-6 text-white transition hover:text-red-500">
            {video?.title || "Untitled Video"}
          </h3>
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <span>{video?.views || 0} views</span>
          {video?.duration && <span>{video.duration}</span>}
        </div>

        {/* Like / Unlike */}
        <button
          type="button"
          onClick={handleLikeVideo}
          disabled={likeLoading || !videoId}
          aria-pressed={isLiked}
          className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 ${
            isLiked
              ? "border-pink-500 bg-pink-600 text-white hover:bg-pink-700"
              : "border-white/15 bg-zinc-900 text-gray-200 hover:border-pink-500 hover:text-white"
          }`}
        >
          {likeLoading
            ? "Please wait..."
            : isLiked
              ? "♥ Liked — Unlike"
              : "♡ Like Video"}
        </button>

        {/* Save / Unsave */}
        <button
          type="button"
          onClick={handleSaveVideo}
          disabled={savedLoading || !videoId}
          aria-pressed={isSaved}
          className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 ${
            isSaved
              ? "border-red-500 bg-red-600 text-white hover:bg-red-700"
              : "border-white/15 bg-zinc-900 text-gray-200 hover:border-red-500 hover:text-white"
          }`}
        >
          {savedLoading
            ? "Please wait..."
            : isSaved
              ? "▣ Saved — Unsave"
              : "▢ Save Video"}
        </button>
      </div>
    </article>
  );
}
