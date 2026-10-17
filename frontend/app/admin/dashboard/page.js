"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

const statLinks = {
  "Total Videos": "/admin/videos",
  "Total Users": "/admin/users",
  "Total Comments": "/admin/comments",
  "Total Likes": "/admin/videos",
  "Contact Messages": "/admin/messages",
};

const initialStats = [
  { title: "Total Videos", value: 0 },
  { title: "Total Users", value: 0 },
  { title: "Total Comments", value: 0 },
  { title: "Total Likes", value: 0 },
  { title: "Contact Messages", value: 0 },
];

const STAT_KEYS = {
  "Total Videos": "totalVideos",
  "Total Users": "totalUsers",
  "Total Comments": "totalComments",
  "Total Likes": "totalLikes",
  "Contact Messages": "totalMessages",
};

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function StatCard({ stat }) {
  return (
    <Link
      href={stat.link || statLinks[stat.title] || "/admin/dashboard"}
      className="group rounded-xl border border-white/10 bg-zinc-950 p-5 transition duration-300 hover:-translate-y-1 hover:border-red-500/40"
    >
      <p className="text-sm text-gray-500">{stat.title}</p>

      <h2 className="mt-3 text-3xl font-bold text-white">
        {formatNumber(stat.value)}
      </h2>

      <p className="mt-3 text-xs font-medium text-red-500 transition group-hover:text-red-400">
        View Details →
      </p>
    </Link>
  );
}

function EmptyState({ message = "No records found." }) {
  return <p className="p-5 text-sm text-gray-500">{message}</p>;
}

export default function AdminDashboardPage() {
  const { error: showError } = useToast();

  const [stats, setStats] = useState(initialStats);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (showNotification = true) => {
      setLoading(true);
      setError("");

      try {
        const result = await apiFetch("/api/admin/dashboard");

        if (!result.success || !result.data?.success) {
          throw new Error(
            result.data?.message || "Dashboard data load nahi ho saka.",
          );
        }

        const data = result.data.data || {};
        const actualStats = data.stats || {};

        setStats(
          initialStats.map((stat) => ({
            ...stat,
            value: actualStats[STAT_KEYS[stat.title]] ?? 0,
            link: statLinks[stat.title],
          })),
        );

        setRecentVideos(
          Array.isArray(data.recentVideos) ? data.recentVideos : [],
        );
        setRecentUsers(Array.isArray(data.recentUsers) ? data.recentUsers : []);
        setRecentComments(
          Array.isArray(data.recentComments) ? data.recentComments : [],
        );
        setRecentMessages(
          Array.isArray(data.recentMessages) ? data.recentMessages : [],
        );
      } catch (err) {
        console.error("Dashboard loading error:", err);

        const message = err.message || "Dashboard data load nahi ho saka.";

        setError(message);

        if (showNotification) {
          showError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const chartColors = [
    "bg-red-600",
    "bg-red-500",
    "bg-red-700",
    "bg-red-400",
    "bg-red-800",
  ];

  const chartData = stats.map((stat, index) => ({
    name: {
      "Total Videos": "Videos",
      "Total Users": "Users",
      "Total Comments": "Comments",
      "Total Likes": "Likes",
      "Contact Messages": "Messages",
    }[stat.title],
    value: Number(stat.value) || 0,
    color: chartColors[index],
  }));

  const maxChartValue = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              Admin Panel
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dashboard</h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Manage your anime website and monitor users, videos, comments,
              likes and messages from one place.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4">
              <p className="text-sm text-red-400">{error}</p>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={loading}
                className="mt-3 text-sm font-semibold text-red-300 underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {/* Statistics */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold">Overview</h2>

              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? "Loading website statistics..."
                  : "Live website statistics"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map((stat) => (
                <StatCard
                  key={stat.title}
                  stat={{
                    ...stat,
                    value: loading ? "..." : stat.value,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Dynamic chart */}
          <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
            <div className="mb-8">
              <h2 className="text-xl font-bold">Website Overview</h2>

              <p className="mt-1 text-sm text-gray-500">
                Comparison of current website totals.
              </p>
            </div>

            <div className="flex h-72 items-end justify-between gap-3 border-b border-white/10 px-2">
              {chartData.map((item) => {
                const height =
                  item.value === 0
                    ? "0%"
                    : `${Math.max((item.value / maxChartValue) * 100, 5)}%`;

                return (
                  <div
                    key={item.name}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <div className="mb-2 text-center text-xs text-gray-400">
                      {loading ? "..." : formatNumber(item.value)}
                    </div>

                    <div
                      className={`w-full max-w-16 rounded-t-lg transition-all duration-500 ${item.color}`}
                      style={{ height }}
                      title={`${item.name}: ${item.value}`}
                    />

                    <p className="mt-3 text-center text-xs text-gray-500 sm:text-sm">
                      {item.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Videos and Users */}
          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h2 className="text-xl font-bold">Recent Videos</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest uploaded videos
                  </p>
                </div>

                <Link
                  href="/admin/videos"
                  className="text-sm font-semibold text-red-500 hover:text-red-400"
                >
                  View All
                </Link>
              </div>

              {loading ? (
                <EmptyState message="Loading videos..." />
              ) : recentVideos.length === 0 ? (
                <EmptyState message="No videos found. Add your first video." />
              ) : (
                <div className="divide-y divide-white/5">
                  {recentVideos.map((video) => (
                    <div
                      key={video._id}
                      className="p-5 transition hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 font-semibold text-white">
                            {video.title || "Untitled video"}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="text-red-500">
                              {video.category?.name || "Uncategorized"}
                            </span>

                            <span>{formatNumber(video.views)} views</span>

                            <span>{formatDate(video.createdAt)}</span>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-500">
                          {video.status || "draft"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h2 className="text-xl font-bold">Recent Users</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Recently registered users
                  </p>
                </div>

                <Link
                  href="/admin/users"
                  className="text-sm font-semibold text-red-500 hover:text-red-400"
                >
                  View All
                </Link>
              </div>

              {loading ? (
                <EmptyState message="Loading users..." />
              ) : recentUsers.length === 0 ? (
                <EmptyState message="No users found." />
              ) : (
                <div className="divide-y divide-white/5">
                  {recentUsers.map((user) => {
                    const displayName =
                      user.name || user.username || user.email || "User";

                    return (
                      <div
                        key={user._id}
                        className="flex items-center gap-4 p-5 transition hover:bg-white/[0.02]"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">
                            {displayName}
                          </h3>

                          <p className="truncate text-sm text-gray-500">
                            {user.email}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-gray-600">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Recent Comments and Messages */}
          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h2 className="text-xl font-bold">Recent Comments</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest comments from users
                  </p>
                </div>

                <Link
                  href="/admin/comments"
                  className="text-sm font-semibold text-red-500 hover:text-red-400"
                >
                  View All
                </Link>
              </div>

              {loading ? (
                <EmptyState message="Loading comments..." />
              ) : recentComments.length === 0 ? (
                <EmptyState message="No comments found." />
              ) : (
                <div className="divide-y divide-white/5">
                  {recentComments.map((comment) => (
                    <div key={comment._id} className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          {comment.user?.name ||
                            comment.user?.username ||
                            "Unknown user"}
                        </h3>

                        <span className="text-xs text-gray-600">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {comment.text}
                      </p>

                      <p className="mt-2 text-xs text-red-500">
                        On: {comment.video?.title || "Unknown video"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h2 className="text-xl font-bold">Recent Messages</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest contact messages
                  </p>
                </div>

                <Link
                  href="/admin/messages"
                  className="text-sm font-semibold text-red-500 hover:text-red-400"
                >
                  View All
                </Link>
              </div>

              {loading ? (
                <EmptyState message="Loading messages..." />
              ) : recentMessages.length === 0 ? (
                <EmptyState message="No contact messages found." />
              ) : (
                <div className="divide-y divide-white/5">
                  {recentMessages.map((message) => (
                    <div key={message._id} className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {message.name}
                          </h3>

                          <p className="truncate text-xs text-gray-600">
                            {message.email}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-gray-600">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">
                        {message.message}
                      </p>

                      <p className="mt-2 text-xs text-red-500">
                        {message.subject || "Contact message"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-6 rounded-xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-bold">Quick Actions</h2>

            <p className="mt-1 text-sm text-gray-500">
              Quickly access common admin tasks.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Manage Videos", "/admin/videos"],
                ["Manage Categories", "/admin/categories"],
                ["Manage Users", "/admin/users"],
                ["View Messages", "/admin/messages"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg border border-white/10 px-4 py-3 text-center text-sm font-semibold transition hover:border-red-500/40 hover:bg-white/5"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
