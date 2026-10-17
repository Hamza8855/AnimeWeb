"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "◈" },
  { label: "Videos", href: "/admin/videos", icon: "▶" },
  { label: "Categories", href: "/admin/categories", icon: "▦" },
  { label: "Users", href: "/admin/users", icon: "♙" },
  { label: "Comments", href: "/admin/comments", icon: "☰" },
  { label: "Messages", href: "/admin/messages", icon: "✉" },
  { label: "Settings", href: "/admin/settings", icon: "⚙" },
];

export default function AdminSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setMenuOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Admin logout error:", error);
      window.alert("Logout nahi ho saka. Please dobara try karein.");
    } finally {
      setLoggingOut(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <style jsx>{`
        @keyframes sidebarEnter {
          from {
            opacity: 0;
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes contentReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes redPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(239, 68, 68, 0);
          }
          50% {
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.16);
          }
        }

        .sidebar-enter {
          animation: sidebarEnter 0.45s ease-out both;
        }

        .nav-reveal {
          animation: contentReveal 0.35s ease-out both;
        }

        .nav-reveal:nth-child(1) {
          animation-delay: 40ms;
        }
        .nav-reveal:nth-child(2) {
          animation-delay: 70ms;
        }
        .nav-reveal:nth-child(3) {
          animation-delay: 100ms;
        }
        .nav-reveal:nth-child(4) {
          animation-delay: 130ms;
        }
        .nav-reveal:nth-child(5) {
          animation-delay: 160ms;
        }
        .nav-reveal:nth-child(6) {
          animation-delay: 190ms;
        }
        .nav-reveal:nth-child(7) {
          animation-delay: 220ms;
        }

        .anime-brand {
          background: linear-gradient(90deg, #ef4444, #f87171, #dc2626);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: brandShine 4s linear infinite;
        }

        @keyframes brandShine {
          to {
            background-position: 200% center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sidebar-enter,
          .nav-reveal,
          .anime-brand {
            animation: none !important;
          }
        }
      `}</style>

      <aside className="sidebar-enter relative z-30 w-full shrink-0 overflow-hidden border-b border-red-500/20 bg-zinc-950 text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-20 h-48 w-48 rounded-full bg-red-600/10 blur-3xl"
        />

        {/* Mobile Header */}
        <div className="relative flex items-center justify-between gap-3 border-b border-white/5 p-4 lg:hidden">
          <Link
            href="/"
            onClick={closeMenu}
            className="min-w-0 text-base font-black tracking-wide sm:text-lg"
          >
            <span className="anime-brand">ANIME INFINITE DEATH</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
            className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-xl text-red-400 transition duration-300 hover:scale-105 hover:border-red-400 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <span className="transition-transform duration-300">
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Desktop Brand */}
        <div className="relative hidden p-5 lg:block">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition hover:text-red-400"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
            View Website
          </Link>

          <div className="mt-6 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-2xl text-red-400">
              ⚔
            </div>

            <h2 className="text-lg font-black tracking-wide">
              <span className="anime-brand">ANIME</span>
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
              Infinite Death
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-[10px] uppercase tracking-widest text-gray-500">
                Admin Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          id="admin-navigation"
          className={`relative overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out lg:block lg:!max-h-[1000px] lg:!opacity-100 ${
            menuOpen
              ? "max-h-[800px] opacity-100"
              : "max-h-0 opacity-0 lg:max-h-none"
          }`}
        >
          <nav className="flex flex-col gap-1 px-3 pb-4 pt-3 lg:px-4 lg:pt-0">
            <p className="mb-2 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600">
              Main Menu
            </p>

            {menuItems.map((item, index) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  style={{ animationDelay: `${index * 45}ms` }}
                  className={`nav-reveal group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm transition-all duration-300 ease-out hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    active
                      ? "bg-gradient-to-r from-red-600/25 to-red-600/5 font-semibold text-white shadow-[inset_3px_0_0_#ef4444]"
                      : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-300 group-hover:scale-110 ${
                      active
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/[0.04] text-gray-500 group-hover:bg-red-500/10 group-hover:text-red-400"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1">{item.label}</span>

                  {active && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  )}

                  {!active && (
                    <span className="translate-x-1 text-red-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      ›
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="my-3 border-t border-white/10" />

            {/* Home Page */}
            <Link
              href="/"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-300 transition-all duration-300 hover:translate-x-1 hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] transition-colors duration-300 group-hover:bg-white/10">
                🏠
              </span>
              <span>Home Page</span>
              <span className="ml-auto text-xs text-gray-600 transition-colors group-hover:text-red-400">
                ↗
              </span>
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm text-red-400 transition-all duration-300 hover:translate-x-1 hover:border-red-500/20 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 transition-all duration-300 group-hover:rotate-[-8deg] group-hover:bg-red-500/20">
                ↪
              </span>

              <span>{loggingOut ? "Logging out..." : "Logout"}</span>
              {!loggingOut && (
                <span className="ml-auto opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                  →
                </span>
              )}
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="relative mx-4 mb-4 hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Anime Infinite Death
            </p>
            <p className="mt-1 text-[10px] text-gray-600">Admin Panel</p>
          </div>
        </div>
      </aside>
    </>
  );
}
