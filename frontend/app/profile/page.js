"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Server se valid response nahi mila.");
  }

  return response.json();
}

function getArray(data, key) {
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
}

function getVideoId(item) {
  const video = item?.video || item;
  return video?._id || video?.id || null;
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [likedCount, setLikedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

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

      const currentUser =
        authData?.user || authData?.data?.user || authData?.data;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (currentUser.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      setUser(currentUser);

      const [likesResult, savedResult] = await Promise.allSettled([
        fetch(`${API_URL}/api/likes`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/saved-videos`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (likesResult.status === "fulfilled") {
        const response = likesResult.value;

        if (response.ok) {
          const data = await readResponse(response);
          const items = getArray(data, "likedVideos");
          setLikedCount(
            typeof data.count === "number"
              ? data.count
              : items.filter((item) => getVideoId(item)).length,
          );
        }
      }

      if (savedResult.status === "fulfilled") {
        const response = savedResult.value;

        if (response.ok) {
          const data = await readResponse(response);
          const items = getArray(data, "savedVideos");
          setSavedCount(
            typeof data.count === "number"
              ? data.count
              : items.filter((item) => getVideoId(item)).length,
          );
        }
      }
    } catch (err) {
      setError(err.message || "Profile load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <p className="text-center text-zinc-400">Loading your profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        {error ? (
          <div className="max-w-md text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadProfile}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-semibold hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <p className="text-zinc-400">Redirecting...</p>
        )}
      </main>
    );
  }

  const accountCreated = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "Not available";

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
              Anime Infinite Death
            </p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              My <span className="text-red-600">Profile</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400 sm:text-base">
              Manage your account and your video collections.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:border-red-600 hover:text-red-500"
          >
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              onClick={loadProfile}
              className="w-fit font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Profile information */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600/15 text-2xl font-bold text-red-500 sm:h-20 sm:w-20 sm:text-3xl">
              {(user.name || user.username || user.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-xl font-bold sm:text-2xl">
                {user.name || "User"}
              </h2>
              <p className="mt-1 break-all text-sm text-zinc-400">
                {user.email}
              </p>
              {user.username && (
                <p className="mt-1 break-words text-sm text-zinc-500">
                  @{user.username}
                </p>
              )}
            </div>

            <Link
              href="/settings"
              className="inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-700 sm:w-auto"
            >
              Account Settings
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-zinc-900/70 p-4">
              <p className="text-xs text-zinc-500">Account Email</p>
              <p className="mt-1 break-all text-sm font-medium">
                {user.email || "Not available"}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-900/70 p-4">
              <p className="text-xs text-zinc-500">Account Created</p>
              <p className="mt-1 text-sm font-medium">{accountCreated}</p>
            </div>
          </div>
        </section>

        {/* Video collection links */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold sm:text-2xl">
              My <span className="text-red-600">Collections</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Open a collection to view and manage your videos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Liked videos */}
            <Link
              href="/profile/liked-videos"
              className="group flex min-w-0 flex-col rounded-2xl border border-white/10 bg-zinc-950 p-5 transition duration-200 hover:-translate-y-1 hover:border-red-600/60 hover:bg-zinc-900 sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/15 text-2xl text-red-500">
                  ♥
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  {likedCount} videos
                </span>
              </div>

              <h3 className="text-lg font-bold transition group-hover:text-red-500">
                Liked Videos
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                View all the anime videos you have liked. You can also unlike
                videos from this page.
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold">
                <span className="text-zinc-300">View collection</span>
                <span className="text-red-500 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>

            {/* Saved videos */}
            <Link
              href="/profile/saved-videos"
              className="group flex min-w-0 flex-col rounded-2xl border border-white/10 bg-zinc-950 p-5 transition duration-200 hover:-translate-y-1 hover:border-red-600/60 hover:bg-zinc-900 sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/15 text-2xl text-red-500">
                  ♡
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  {savedCount} videos
                </span>
              </div>

              <h3 className="text-lg font-bold transition group-hover:text-red-500">
                Saved Videos
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                Find the videos you saved and remove them from your saved
                collection whenever you want.
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold">
                <span className="text-zinc-300">View collection</span>
                <span className="text-red-500 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>

            {/* Account settings */}
            <Link
              href="/settings"
              className="group flex min-w-0 flex-col rounded-2xl border border-white/10 bg-zinc-950 p-5 transition duration-200 hover:-translate-y-1 hover:border-red-600/60 hover:bg-zinc-900 sm:p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl text-zinc-200">
                ⚙
              </div>

              <h3 className="text-lg font-bold transition group-hover:text-red-500">
                Account Settings
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                Manage your profile details, change your password, or access
                other account options.
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold">
                <span className="text-zinc-300">Manage account</span>
                <span className="text-red-500 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
