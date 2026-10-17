"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function FeaturedVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFeaturedVideos() {
    setLoading(true);
    setError("");

    try {
      const result = await apiFetch("/api/videos?featured=true", {
        method: "GET",
      });

      if (!result.success) {
        setError("Featured videos are temporarily unavailable.");
        return;
      }

      const responseData = result.data;

      const allVideos = Array.isArray(responseData?.videos)
        ? responseData.videos
        : Array.isArray(responseData?.data?.videos)
          ? responseData.data.videos
          : [];

      const publishedFeaturedVideos = allVideos.filter(
        (video) => video.isFeatured === true && video.status === "published",
      );

      setVideos(publishedFeaturedVideos);
    } catch {
      setError("Featured videos are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeaturedVideos();
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-400"
        >
          <span aria-hidden="true">←</span>
          Back to Home
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Anime Infinite Death
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Featured Videos
          </h1>

          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Explore our handpicked anime content.
          </p>
        </header>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
              >
                <div className="aspect-video bg-zinc-800" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 rounded bg-zinc-800" />
                  <div className="h-5 w-3/4 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
            <p className="text-gray-300">{error}</p>

            <button
              type="button"
              onClick={loadFeaturedVideos}
              className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-zinc-950 p-10 text-center">
            <h2 className="text-xl font-semibold">No Featured Videos Yet</h2>

            <p className="mt-3 text-gray-400">
              Featured videos will appear here when available.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => {
              const id = video._id || video.id;

              const image =
                video.thumbnail ||
                (video.youtubeId
                  ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
                  : "/images/anime-1.jpg");

              return (
                <article
                  key={id}
                  className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
                >
                  {/* Thumbnail only: no Link, iframe, or play button */}
                  <div className="aspect-video overflow-hidden bg-zinc-900">
                    <img
                      src={image}
                      alt={video.title || "Featured anime video"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                      {video.category?.name || "Anime"}
                    </p>

                    <h2 className="mt-2 line-clamp-2 text-lg font-bold">
                      {video.title || "Untitled Video"}
                    </h2>

                    {video.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">
                        {video.description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
