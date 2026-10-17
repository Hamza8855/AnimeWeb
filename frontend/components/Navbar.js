"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

const DEFAULT_SETTINGS = {
  channelName: "Anime Infinite Death",
  logo: "",
  youtubeUrl: "https://www.youtube.com/@Animeinfinitydeath1234",
};

export default function Navbar() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pathname = usePathname();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";

  // Load website settings
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const result = await apiFetch("/api/settings", {
        method: "GET",
      });

      if (!active || !result.success) return;

      const savedSettings = result.data?.settings || result.data;

      if (savedSettings && typeof savedSettings === "object") {
        setSettings((previous) => ({
          ...previous,
          ...savedSettings,
        }));
      }
    }

    loadSettings().catch((error) => {
      console.error("Settings Load Error:", error);
    });

    return () => {
      active = false;
    };
  }, []);

  // Verify the current session with the backend
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      setIsLoading(true);

      try {
        const result = await apiFetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (active) {
          const currentUser = result.success ? result.data?.user : null;

          setUser(currentUser || null);
        }
      } catch (error) {
        if (active) {
          setUser(null);
        }

        console.error("Auth Check Error:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [pathname]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Logout for both Admin and normal users
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const wasAdmin = isAdmin;

      const result = await apiFetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!result.success) {
        console.error("Logout failed:", result.data?.message);
        return;
      }

      setUser(null);
      closeMenu();

      window.location.href = wasAdmin ? "/admin/login" : "/";
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close the mobile menu when the route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const linkClass =
    "whitespace-nowrap text-sm font-medium text-gray-300 transition hover:text-red-500";

  const mobileLinkClass =
    "block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-red-500";

  const youtubeUrl = settings.youtubeUrl || DEFAULT_SETTINGS.youtubeUrl;

  const channelName = settings.channelName || DEFAULT_SETTINGS.channelName;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur-md">
      <nav className="mx-auto flex min-h-20 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
        {/* Logo and channel name */}
        <div className="min-w-0 flex-1 lg:flex-none">
          <Link
            href="/"
            onClick={closeMenu}
            className="inline-flex max-w-full items-center gap-2 text-base font-bold tracking-wide text-white sm:text-xl lg:text-2xl"
          >
            {settings.logo && (
              <img
                src={settings.logo}
                alt={`${channelName} logo`}
                className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
              />
            )}

            <span className="break-words">{channelName}</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-6">
          {isAdmin ? (
            <>
              <Link href="/" className={linkClass}>
                Home
              </Link>

              <Link href="/videos" className={linkClass}>
                Videos
              </Link>

              <Link href="/categories" className={linkClass}>
                Categories
              </Link>

              <Link href="/admin/dashboard" className={linkClass}>
                Admin Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={linkClass}>
                Home
              </Link>

              <Link href="/videos" className={linkClass}>
                Videos
              </Link>

              <Link href="/categories" className={linkClass}>
                Categories
              </Link>

              <Link href="/about" className={linkClass}>
                About
              </Link>

              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
            </>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center justify-end gap-2 lg:flex xl:gap-3">
          {!isAdmin && (
            <>
              <Link
                href="/videos"
                className="whitespace-nowrap rounded-lg border border-gray-800 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-red-500"
              >
                Search
              </Link>

              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                YouTube
              </a>
            </>
          )}

          {!isLoading &&
            (isLoggedIn ? (
              <>
                {!isAdmin && (
                  <Link
                    href="/profile"
                    className="whitespace-nowrap rounded-lg border border-gray-800 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-red-500"
                  >
                    Profile
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="whitespace-nowrap rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={isAdmin ? "/admin/login" : "/login"}
                  className="whitespace-nowrap rounded-lg border border-gray-800 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-red-500"
                >
                  Login
                </Link>

                {!isAdmin && (
                  <Link
                    href="/signup"
                    className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Sign Up
                  </Link>
                )}
              </>
            ))}
        </div>

        {/* Mobile actions */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-800"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="text-3xl font-bold leading-none text-white">
              {isMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-white/10 bg-black px-4 py-5 sm:px-6 lg:hidden"
        >
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  Admin Dashboard
                </Link>

                <Link href="/" onClick={closeMenu} className={mobileLinkClass}>
                  Home
                </Link>
              </>
            ) : (
              <>
                <Link href="/" onClick={closeMenu} className={mobileLinkClass}>
                  Home
                </Link>

                <Link
                  href="/videos"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  Videos
                </Link>

                <Link
                  href="/categories"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  Categories
                </Link>

                <Link
                  href="/about"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  About
                </Link>

                <Link
                  href="/contact"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  Contact
                </Link>

                <Link
                  href="/videos"
                  onClick={closeMenu}
                  className={`${mobileLinkClass} mt-1 border border-gray-800 hover:border-red-500`}
                >
                  🔍 Search Videos
                </Link>

                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="mt-1 block rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Visit YouTube
                </a>
              </>
            )}

            {/* Mobile authentication */}
            {!isLoading &&
              (isLoggedIn ? (
                <>
                  {!isAdmin && (
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className={mobileLinkClass}
                    >
                      Profile
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="mt-2 block w-full rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={isAdmin ? "/admin/login" : "/login"}
                    onClick={closeMenu}
                    className={`${mobileLinkClass} mt-2 border border-gray-800 text-center hover:border-red-500`}
                  >
                    Login
                  </Link>

                  {!isAdmin && (
                    <Link
                      href="/signup"
                      onClick={closeMenu}
                      className="block rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Sign Up
                    </Link>
                  )}
                </>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
