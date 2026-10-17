"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const DEFAULT_SETTINGS = {
  channelName: "Anime Infinite Death",
  channelDescription:
    "Explore anime stories, powerful characters, epic battles, theories and interesting content.",
  logo: "/images/logo.jpg",
  youtubeUrl: "https://www.youtube.com/@Animeinfinitydeath1234",
};

const DEFAULT_LATEST_VIDEOS = [
  {
    id: "default-1",
    title: "The Strongest Anime Characters Ranked",
    category: "Anime",
    views: "125K",
    duration: "12:45",
    image: "/images/anime-1.jpg",
    description: "",
  },
  {
    id: "default-2",
    title: "Top 10 Anime Battles You Must Watch",
    category: "Battles",
    views: "98K",
    duration: "10:21",
    image: "/images/anime-2.jpg",
    description: "",
  },
  {
    id: "default-3",
    title: "Darkest Anime Stories Explained",
    category: "Stories",
    views: "76K",
    duration: "15:08",
    image: "/images/anime-3.jpg",
    description: "",
  },
];

const DEFAULT_POPULAR_VIDEOS = [
  {
    id: "popular-1",
    title: "Most Powerful Anime Villains",
    category: "Characters",
    views: "210K",
    duration: "13:40",
    image: "/images/anime-2.jpg",
    description: "",
  },
  {
    id: "popular-2",
    title: "Best Anime Fights of All Time",
    category: "Battles",
    views: "182K",
    duration: "11:35",
    image: "/images/anime-3.jpg",
    description: "",
  },
  {
    id: "popular-3",
    title: "Anime Stories You Should Know",
    category: "Stories",
    views: "156K",
    duration: "14:22",
    image: "/images/anime-1.jpg",
    description: "",
  },
];

const DEFAULT_CATEGORIES = [
  {
    name: "Anime",
    slug: "anime",
    description: "Latest anime content and discussions",
    icon: "🎌",
  },
  {
    name: "Battles",
    slug: "battles",
    description: "Epic anime fights and battles",
    icon: "⚔️",
  },
  {
    name: "Characters",
    slug: "characters",
    description: "Powerful and interesting characters",
    icon: "🔥",
  },
  {
    name: "Stories",
    slug: "stories",
    description: "Anime stories and explanations",
    icon: "📖",
  },
];

const categoryBadges = [
  "Anime",
  "Characters",
  "Battles",
  "Stories",
  "Theories",
];

function formatViews(value) {
  if (typeof value === "string" && /[KM]/i.test(value)) {
    return value;
  }

  const views = Number(value || 0);

  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }

  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }

  return String(views);
}

function mapVideo(video) {
  return {
    id: video._id || video.id,
    title: video.title || "Untitled Video",
    category:
      video.category?.name ||
      video.categoryName ||
      (typeof video.category === "string" ? video.category : "") ||
      "Anime",
    views: formatViews(video.views),
    duration: video.duration || "Video",
    image:
      video.thumbnail ||
      (video.youtubeId
        ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
        : "/images/anime-1.jpg"),
    description: video.description || "",
    youtubeUrl: video.youtubeUrl || "",
    youtubeId: video.youtubeId || "",
    isFeatured: Boolean(video.isFeatured),
    status: video.status || "published",
  };
}

function mapCategoryIcon(name) {
  const normalizedName = name?.toLowerCase();

  if (normalizedName === "battles") return "⚔️";
  if (normalizedName === "characters") return "🔥";
  if (normalizedName === "stories") return "📖";

  return "🎌";
}

function getVideosFromResponse(result) {
  const responseData = result?.data;

  if (Array.isArray(responseData?.videos)) {
    return responseData.videos;
  }

  if (Array.isArray(responseData?.data?.videos)) {
    return responseData.data.videos;
  }

  return [];
}

function VideoCard({ video }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-950 transition duration-300 hover:-translate-y-1 hover:border-red-500/50"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        <img
          src={video.image}
          alt={video.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/40" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
            ▶
          </div>
        </div>

        <span className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-xs text-white">
          {video.duration}
        </span>
      </div>

      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-500">
          {video.category}
        </span>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-7 transition group-hover:text-red-400">
          {video.title}
        </h3>

        <p className="mt-3 text-sm text-gray-500">{video.views} views</p>
      </div>
    </Link>
  );
}

function FeaturedPlayer({ video, onClose }) {
  if (!video?.youtubeId) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-4 text-center">
        <p className="text-sm text-gray-300">
          YouTube video ID is not available for this video.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Back to Thumbnail
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 bg-black">
      <iframe
        key={video.youtubeId}
        src={`https://www.youtube.com/embed/${encodeURIComponent(
          video.youtubeId,
        )}?autoplay=1&rel=0`}
        title={video.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close video player"
        className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/80 text-xl text-white transition hover:bg-red-600"
      >
        ×
      </button>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [videos, setVideos] = useState([]);
  const [databaseCategories, setDatabaseCategories] = useState([]);
  const [playingFeaturedAt, setPlayingFeaturedAt] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      const [
        settingsResult,
        videosResult,
        featuredVideosResult,
        categoriesResult,
      ] = await Promise.allSettled([
        apiFetch("/api/settings", { method: "GET" }),
        apiFetch("/api/videos", { method: "GET" }),
        apiFetch("/api/videos?featured=true", { method: "GET" }),
        apiFetch("/api/categories", { method: "GET" }),
      ]);

      if (!active) return;

      // Load channel settings
      if (settingsResult.status === "fulfilled") {
        const result = settingsResult.value;

        if (result.success) {
          const savedSettings = result.data?.settings || result.data;

          if (savedSettings) {
            setSettings((previous) => ({
              ...previous,
              ...savedSettings,
              logo: savedSettings.logo || previous.logo,
              youtubeUrl: savedSettings.youtubeUrl || previous.youtubeUrl,
            }));
          }
        } else {
          console.error("Home Settings API Error:", result.data);
        }
      } else {
        console.error("Home Settings Load Error:", settingsResult.reason);
      }

      // Load normal published videos
      const normalResult =
        videosResult.status === "fulfilled" ? videosResult.value : null;

      const normalVideos =
        normalResult?.success === true
          ? getVideosFromResponse(normalResult)
          : [];

      if (videosResult.status === "rejected") {
        console.error("Home Videos Load Error:", videosResult.reason);
      } else if (normalResult && !normalResult.success) {
        console.error("Home Videos API Error:", normalResult.data);
      }

      // Load featured videos, including featured drafts
      const featuredResult =
        featuredVideosResult.status === "fulfilled"
          ? featuredVideosResult.value
          : null;

      const featuredVideos =
        featuredResult?.success === true
          ? getVideosFromResponse(featuredResult)
          : [];

      if (featuredVideosResult.status === "rejected") {
        console.error(
          "Home Featured Videos Load Error:",
          featuredVideosResult.reason,
        );
      } else if (featuredResult && !featuredResult.success) {
        console.error("Home Featured Videos API Error:", featuredResult.data);
      }

      // Combine both responses and remove duplicate videos
      const combinedVideos = [...featuredVideos, ...normalVideos];

      const uniqueVideos = Array.from(
        new Map(
          combinedVideos.map((video) => [video._id || video.id, video]),
        ).values(),
      );

      if (active) {
        setVideos(uniqueVideos.map(mapVideo));
      }

      // Load categories
      if (categoriesResult.status === "fulfilled") {
        const result = categoriesResult.value;

        if (result.success) {
          const responseData = result.data;

          const fetchedCategories = Array.isArray(responseData?.categories)
            ? responseData.categories
            : Array.isArray(responseData?.data?.categories)
              ? responseData.data.categories
              : [];

          if (active) {
            setDatabaseCategories(fetchedCategories);
          }
        } else {
          console.error("Home Categories API Error:", result.data);
        }
      } else {
        console.error("Home Categories Load Error:", categoriesResult.reason);
      }
    }

    loadHomeData().catch((error) => {
      console.error("Home Data Load Error:", error);
    });

    return () => {
      active = false;
    };
  }, []);

  const channelName = settings.channelName || DEFAULT_SETTINGS.channelName;

  const channelDescription =
    settings.channelDescription || DEFAULT_SETTINGS.channelDescription;

  const channelLogo = settings.logo || DEFAULT_SETTINGS.logo;

  const youtubeUrl = settings.youtubeUrl || DEFAULT_SETTINGS.youtubeUrl;

  // Featured section: all featured videos, drafts included
  const featuredVideos = videos.filter(
    (video) => video.isFeatured && video.status === "published",
  );

  const homeFeaturedVideos = featuredVideos.slice(0, 5);

  // Latest and Popular sections: non-featured videos only
  const normalVideos = videos.filter(
    (video) => !video.isFeatured && video.status === "published",
  );

  const latestVideo = normalVideos[0] || null;

  const latestVideos =
    normalVideos.length > 0 ? normalVideos.slice(0, 3) : DEFAULT_LATEST_VIDEOS;

  const popularVideos =
    normalVideos.length > 0
      ? [...normalVideos]
          .sort((a, b) => {
            const parseViews = (value) => {
              const text = String(value || "0").toUpperCase();
              const number = Number.parseFloat(text) || 0;

              if (text.includes("M")) return number * 1000000;
              if (text.includes("K")) return number * 1000;

              return number;
            };

            return parseViews(b.views) - parseViews(a.views);
          })
          .slice(0, 3)
      : DEFAULT_POPULAR_VIDEOS;

  const categories =
    databaseCategories.length > 0
      ? databaseCategories.map((category) => ({
          name: category.name,
          slug: category.slug || category.name,
          description: category.description || "Explore anime content",
          icon: mapCategoryIcon(category.name),
        }))
      : DEFAULT_CATEGORIES;

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 sm:pt-8 sm:pb-24 lg:px-8 lg:pt-8 lg:pb-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="mb-7 flex flex-col items-center gap-5 sm:flex-row">
                <img
                  src={channelLogo}
                  alt={`${channelName} Logo`}
                  className="h-24 w-24 rounded-full border-2 border-red-500/30 object-cover shadow-2xl shadow-red-950/30 sm:h-28 sm:w-28"
                />

                <div className="text-center sm:text-left">
                  <span className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
                    Welcome to
                  </span>

                  <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                    {channelName}
                  </h2>
                </div>
              </div>

              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Explore the World of <span className="text-red-500">Anime</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
                {channelDescription}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {categoryBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    if (latestVideo) {
                      setPlayingFeaturedAt("hero");
                    }
                  }}
                  disabled={!latestVideo}
                  className="rounded-xl bg-red-600 px-6 py-3.5 text-center font-semibold transition hover:-translate-y-1 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Watch Latest Video
                </button>

                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-gray-700 px-6 py-3.5 text-center font-semibold transition hover:-translate-y-1 hover:border-red-500 hover:text-red-400"
                >
                  ▶ Visit YouTube Channel
                </a>
              </div>

              <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-gray-800 pt-8 sm:gap-8">
                <div>
                  <h3 className="text-2xl font-bold sm:text-3xl">100+</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Videos
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold sm:text-3xl">50K+</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Subscribers
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold sm:text-3xl">1M+</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">Views</p>
                </div>
              </div>
            </div>

            {/* Latest Video Preview: playable */}
            {latestVideo && (
              <div className="relative">
                <div className="absolute -inset-5 rounded-3xl bg-red-600/10 blur-3xl" />

                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
                  <div className="relative aspect-video overflow-hidden">
                    {playingFeaturedAt === "hero" ? (
                      <FeaturedPlayer
                        video={latestVideo}
                        onClose={() => setPlayingFeaturedAt(null)}
                      />
                    ) : (
                      <>
                        <img
                          src={latestVideo.image}
                          alt={latestVideo.title}
                          className="h-full w-full object-cover transition duration-700 hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        <button
                          type="button"
                          onClick={() => setPlayingFeaturedAt("hero")}
                          className="absolute inset-0 flex items-center justify-center"
                          aria-label={`Play ${latestVideo.title}`}
                        >
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-xl shadow-2xl transition hover:scale-110 hover:bg-red-700 sm:h-20 sm:w-20 sm:text-2xl">
                            ▶
                          </span>
                        </button>

                        <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                          Latest Video
                        </span>

                        <span className="absolute bottom-4 right-4 rounded bg-black/80 px-2 py-1 text-xs">
                          {latestVideo.duration}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="p-6 sm:p-7">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-500">
                      {latestVideo.category}
                    </span>

                    <h2 className="mt-2 text-xl font-bold leading-7 sm:text-2xl">
                      {latestVideo.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      {latestVideo.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                      <span>{latestVideo.views} views</span>

                      <button
                        type="button"
                        onClick={() => setPlayingFeaturedAt("hero")}
                        className="font-semibold text-red-500 hover:text-red-400"
                      >
                        Watch →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURED VIDEOS */}

      {/* FEATURED VIDEOS */}
      {homeFeaturedVideos.length > 0 && (
        <section className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
          {/* Background decoration */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-red-600/10 blur-[100px]"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            {/* Section heading and button */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                    Editor's Selection
                  </span>
                </div>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Featured <span className="text-red-500">Videos</span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400 sm:text-base">
                  Discover our handpicked anime content, featuring memorable
                  characters, epic battles, and unforgettable stories.
                </p>
              </div>

              {/* Show button only when there are more than 3 featured videos */}
              {featuredVideos.length > 1 && (
                <Link
                  href="/featured-videos"
                  className="group inline-flex w-fit shrink-0 items-center justify-center gap-3 rounded-xl border border-red-500/40 bg-red-600/10 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  View All Featured
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              )}
            </div>

            {/* Featured video cards: display only, no playback */}
            <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {homeFeaturedVideos.slice(0, 3).map((video, index) => (
                <article
                  key={video.id}
                  style={{ animationDelay: `${index * 120}ms` }}
                  className="group animate-[fadeInUp_0.6s_ease-out_both] min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition-all duration-300 hover:-translate-y-2 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-950/30"
                >
                  <div className="relative aspect-video overflow-hidden bg-zinc-900">
                    <img
                      src={video.image || "/images/anime-1.jpg"}
                      alt={video.title || "Featured anime video"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                    <span className="absolute left-4 top-4 rounded-full border border-red-400/30 bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-400 backdrop-blur-md">
                      Featured
                    </span>

                    <span className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                      {video.category || "Anime"}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white transition-colors duration-300 group-hover:text-red-400 sm:text-xl">
                      {video.title || "Untitled Video"}
                    </h3>

                    {video.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">
                        {video.description}
                      </p>
                    )}

                    <div className="mt-5 h-px w-full bg-white/10">
                      <div className="h-px w-0 bg-red-500 transition-all duration-500 group-hover:w-full" />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Small section footer */}
            {featuredVideos.length > 3 && (
              <p className="mt-6 text-center text-xs text-gray-500 sm:text-right">
                Showing 3 of {featuredVideos.length} featured videos
              </p>
            )}
          </div>
        </section>
      )}

      {/* LATEST VIDEOS */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                Latest Content
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Latest Videos
              </h2>

              <p className="mt-3 text-gray-400">
                Check out the latest videos from our channel.
              </p>
            </div>

            <Link
              href="/videos"
              className="hidden text-sm font-semibold text-red-500 hover:text-red-400 sm:block"
            >
              View All →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/videos" className="font-semibold text-red-500">
              View All Videos →
            </Link>
          </div>
        </div>
      </section>

      {/* POPULAR VIDEOS */}
      <section className="border-y border-gray-900 bg-gray-950/50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Most Watched
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Popular Videos
            </h2>

            <p className="mt-3 text-gray-400">
              Explore some of the most popular content.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}

      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          {/* Heading and View All Button */}
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                Explore
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Browse Categories
              </h2>

              <p className="mt-3 text-gray-400">
                Find content based on your favorite anime topics.
              </p>
            </div>

            {/* Show button only when categories are more than 4 */}
            {categories.length > 4 && (
              <Link
                href="/categories"
                className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg border border-red-600 px-5 py-3 text-sm font-semibold text-red-500 transition duration-300 hover:bg-red-600 hover:text-white"
              >
                View All Categories
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>

          {/* Show maximum 4 categories on Home page */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                href={`/videos?category=${encodeURIComponent(
                  category.slug || category.name,
                )}`}
                key={category._id || category.slug || category.name}
                className="group rounded-xl border border-gray-800 bg-black p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/50"
              >
                <div className="text-4xl transition duration-300 group-hover:scale-110">
                  {category.icon}
                </div>

                <h3 className="mt-5 text-xl font-bold group-hover:text-red-500">
                  {category.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {category.description}
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-red-500">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT CHANNEL */}
      <section className="border-y border-gray-900 bg-gray-950/50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                About The Channel
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Welcome to {channelName}
              </h2>

              <p className="mt-6 leading-8 text-gray-400">
                {channelDescription}
              </p>

              <p className="mt-4 leading-8 text-gray-400">
                Explore channel content, discover categories and watch your
                favorite videos on our website.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/about"
                  className="rounded-lg border border-red-600 px-6 py-3 text-center font-semibold text-red-500 transition hover:bg-red-600 hover:text-white"
                >
                  Learn More
                </Link>

                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-700 px-6 py-3 text-center font-semibold transition hover:border-red-500 hover:text-red-400"
                >
                  Visit YouTube
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 sm:p-8">
                <div className="text-3xl">🎬</div>
                <h3 className="mt-4 text-2xl font-bold">100+</h3>
                <p className="mt-1 text-gray-500">Videos</p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 sm:p-8">
                <div className="text-3xl">👥</div>
                <h3 className="mt-4 text-2xl font-bold">50K+</h3>
                <p className="mt-1 text-gray-500">Subscribers</p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 sm:p-8">
                <div className="text-3xl">👀</div>
                <h3 className="mt-4 text-2xl font-bold">1M+</h3>
                <p className="mt-1 text-gray-500">Views</p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 sm:p-8">
                <div className="text-3xl">🎌</div>
                <h3 className="mt-4 text-xl font-bold">{channelName}</h3>
                <p className="mt-1 text-gray-500">Channel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSCRIBE CTA */}
      <section className="relative overflow-hidden border-t border-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/50 via-black to-red-950/20" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <img
            src={channelLogo}
            alt={channelName}
            className="mx-auto h-20 w-20 rounded-full border border-red-500/30 object-cover"
          />

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
            Join The Community
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Don&apos;t Miss the Next Video
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-gray-400">
            {channelDescription}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-red-600 px-8 py-3.5 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-red-700"
            >
              ▶ Visit YouTube Channel
            </a>

            <Link
              href="/videos"
              className="rounded-xl border border-gray-700 px-8 py-3.5 font-semibold transition duration-300 hover:-translate-y-1 hover:border-red-500 hover:text-red-400"
            >
              Explore Videos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
