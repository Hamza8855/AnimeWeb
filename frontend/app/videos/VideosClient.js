"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import SearchBar from "../../components/SearchBar";
import CategoryFilter from "../../components/CategoryFilter";
import VideoGrid from "../../components/VideoGrid";
import { apiFetch } from "../../lib/api";

const VIDEOS_PER_PAGE = 12;

export default function VideosClient() {
  const searchParams = useSearchParams();

  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // URL se category read karo.
  useEffect(() => {
    const categoryFromURL = searchParams.get("category");

    setSelectedCategory(categoryFromURL || "All");
    setCurrentPage(1);
  }, [searchParams]);

  // Categories alag load karo taake tamam categories available hon.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const result = await apiFetch("/api/categories", {
          method: "GET",
        });

        if (!result.success || cancelled) return;

        const fetchedCategories = Array.isArray(result.data?.categories)
          ? result.data.categories
          : [];

        setCategoryRecords(fetchedCategories);

        const categoryNames = fetchedCategories
          .map((category) => category.name)
          .filter(Boolean);

        setCategories(["All", ...new Set(categoryNames)]);
      } catch (err) {
        console.error("Categories load error:", err);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search/category/page change hone par backend se videos load karo.
  useEffect(() => {
    let cancelled = false;

    async function loadVideos() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("page", String(currentPage));
        params.set("limit", String(VIDEOS_PER_PAGE));

        const searchText = search.trim();

        if (searchText) {
          params.set("search", searchText);
        }

        if (selectedCategory !== "All") {
          const matchedCategory = categoryRecords.find(
            (category) =>
              category.name?.toLowerCase() === selectedCategory.toLowerCase() ||
              category.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
              String(category._id) === selectedCategory,
          );

          params.set(
            "category",
            matchedCategory?.slug || matchedCategory?._id || selectedCategory,
          );
        }

        const result = await apiFetch(`/api/videos?${params.toString()}`, {
          method: "GET",
        });

        if (!result.success) {
          throw new Error(
            result.data?.message ||
              "We couldn't load the videos. Please try again.",
          );
        }

        if (cancelled) return;

        const data = result.data || {};
        const fetchedVideos = Array.isArray(data.videos) ? data.videos : [];

        const pages = Math.max(0, Number(data.totalPages) || 0);

        // Agar current page available na rahe to valid page par wapas aao.
        if (pages > 0 && currentPage > pages) {
          setCurrentPage(pages);
          return;
        }

        setVideos(fetchedVideos);
        setTotalVideos(Number(data.totalVideos ?? data.count) || 0);
        setTotalPages(pages);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Videos load karte waqt error aaya.");
          setVideos([]);
          setTotalVideos(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // Search typing ke baad chhota delay, taake har key par request na ho.
    const timeoutId = setTimeout(loadVideos, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [currentPage, search, selectedCategory, categoryRecords]);

  // Backend se already filtered videos aa rahe hain.
  const filteredVideos = useMemo(() => videos, [videos]);

  // Page numbers ko limited rakho, taake mobile par layout na phailay.
  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);

    const pages = [];

    if (start > 1) {
      pages.push(1);

      if (start > 2) pages.push("...");
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  function changeCategory(category) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

  function changeSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);

    // Page change ke baad videos section par le jao.
    if (typeof document !== "undefined") {
      document
        .getElementById("videos-list")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Page Header */}
      <section className="border-b border-white/10 bg-gradient-to-b from-red-950/30 to-black">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
            Anime Infinite Death
          </p>

          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            All Videos
          </h1>

          <p className="mt-4 max-w-2xl text-gray-400">
            Explore our latest anime videos, battles, characters, stories and
            much more.
          </p>
        </div>
      </section>

      {/* Search and Categories */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar value={search} onChange={changeSearch} />

          <CategoryFilter
            categories={categories}
            activeCategory={selectedCategory}
            onCategoryChange={changeCategory}
          />
        </div>
      </section>

      {/* Videos */}
      <section
        id="videos-list"
        className="mx-auto max-w-7xl scroll-mt-6 px-6 pb-20 lg:px-8"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            {selectedCategory === "All"
              ? "Latest Videos"
              : `${selectedCategory} Videos`}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading videos..." : `${totalVideos} videos available`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-gray-950 px-6 py-16 text-center text-gray-400">
            Loading videos...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-gray-950 px-6 py-12 text-center">
            <h3 className="text-xl font-bold text-red-400">
              We couldn’t load the videos right now. Please try again.
            </h3>

            <p className="mt-3 text-sm text-gray-400">{error}</p>

            <button
              onClick={() => setCurrentPage((page) => page)}
              className="mt-5 rounded-lg bg-red-600 px-5 py-2 font-semibold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filteredVideos.length > 0 ? (
          <>
            <VideoGrid videos={filteredVideos} />

            {/* Responsive Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Video pages"
                className="mt-12 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold transition hover:border-red-500 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                >
                  Previous
                </button>

                {visiblePages.map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-gray-500"
                      aria-hidden="true"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      aria-label={`Go to page ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        currentPage === page
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-white/10 text-gray-300 hover:border-red-500 hover:bg-red-600/20"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold transition hover:border-red-500 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                >
                  Next
                </button>
              </nav>
            )}

            {totalPages > 1 && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-gray-950 px-6 py-16 text-center">
            <h3 className="text-2xl font-bold">No Videos Found</h3>

            <p className="mt-2 text-gray-400">
              {totalVideos === 0
                ? "No videos match your search or selected category. Try different keywords or choose another category."
                : "No videos are available at the moment. Please check back soon."}
            </p>

            {(selectedCategory !== "All" || search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                  setCurrentPage(1);
                }}
                className="mt-5 rounded-lg bg-red-600 px-5 py-2 font-semibold hover:bg-red-700"
              >
                Show All Videos
              </button>
            )}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 bg-gray-950">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">Want to Discover More?</h2>

          <p className="mt-3 text-gray-400">
            Explore different anime categories and find your favorite content.
          </p>

          <Link
            href="/categories"
            className="mt-7 inline-block rounded-lg bg-red-600 px-7 py-3 font-semibold transition hover:bg-red-700"
          >
            Explore Categories
          </Link>
        </div>
      </section>
    </main>
  );
}
