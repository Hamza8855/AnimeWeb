"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

function getArray(response, key) {
  const data = response?.data;

  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(response?.[key])) return response[key];

  return [];
}

function getCategoryId(category) {
  if (!category) return "";
  if (typeof category === "string") return category;
  return String(category._id || category.id || "");
}

function getVideoCount(category, videos) {
  return videos.filter((video) => {
    const videoCategory = video.category;

    if (!videoCategory) return false;

    const sameId =
      getCategoryId(videoCategory) &&
      getCategoryId(videoCategory) ===
        String(category._id || category.id || "");

    const videoCategoryName =
      typeof videoCategory === "object" ? videoCategory.name : "";

    const sameName =
      videoCategoryName &&
      category.name &&
      videoCategoryName.toLowerCase() === category.name.toLowerCase();

    return sameId || sameName;
  }).length;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const [categoriesResponse, videosResponse] = await Promise.all([
          apiFetch("/api/categories", { method: "GET" }),
          apiFetch("/api/videos", { method: "GET" }),
        ]);

        if (
          categoriesResponse?.success === false ||
          videosResponse?.success === false
        ) {
          throw new Error("Unable to Load Categories");
        }
        const fetchedCategories = getArray(categoriesResponse, "categories");

        const fetchedVideos = getArray(videosResponse, "videos");

        if (!cancelled) {
          setCategories(fetchedCategories);
          setVideos(fetchedVideos);
        }
      } catch (err) {
        console.error("Categories page error:", err);

        if (!cancelled) {
          setError(
            err.message ||
              "We couldn't load the categories right now. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
            Explore
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl lg:text-6xl">
            Anime Categories
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
            Explore Anime Infinite Death content by category and discover videos
            based on your favorite anime topics.
          </p>
        </section>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center text-gray-400">
            Loading categories...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-12 rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-red-400">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Categories from MongoDB */}
        {!loading && !error && (
          <section className="mt-12 sm:mt-16">
            {categories.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950 px-6 py-16 text-center">
                <h2 className="text-xl font-bold">No Categories Available</h2>
                <p className="mt-3 text-sm text-gray-400">
                  No categories are available at the moment. Please check back
                  soon.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => {
                  const count = getVideoCount(category, videos);

                  const categoryKey =
                    category._id || category.id || category.slug;

                  const categoryLink = category.slug || category.name;

                  return (
                    <Link
                      key={categoryKey}
                      href={`/videos?category=${encodeURIComponent(category.slug || category.name)}`}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:bg-zinc-900"
                    >
                      {/* Database Image */}
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name || "Category"}
                          className="h-44 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-red-950 via-zinc-900 to-black">
                          <span className="text-5xl text-red-500 transition group-hover:scale-110">
                            ✦
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        <h2 className="text-xl font-bold text-white">
                          {category.name}
                        </h2>

                        <p className="mt-3 min-h-12 text-sm leading-6 text-gray-400">
                          {category.description || "No description available."}
                        </p>

                        <p className="mt-5 text-sm font-semibold text-red-500">
                          {count} {count === 1 ? "Video" : "Videos"}
                        </p>

                        <div className="mt-5 text-sm font-medium text-gray-500 transition group-hover:text-white">
                          Explore Category →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Bottom Section */}
        <section className="mt-16 rounded-2xl border border-white/10 bg-zinc-950 px-6 py-12 text-center sm:mt-20 sm:px-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Looking For More Anime Content?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
            Explore all Anime Infinite Death videos and discover new anime
            content.
          </p>

          <Link
            href="/videos"
            className="mt-7 inline-block rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            View All Videos
          </Link>
        </section>
      </div>
    </main>
  );
}
