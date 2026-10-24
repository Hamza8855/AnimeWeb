"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://anime-web-wjdk.vercel.app";

export default function EditProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || "Unable to load your profile. Please try again.",
          );
        }

        const user = result.user || result.data?.user;

        if (!user) {
          throw new Error("User information could not be retrieved.");
        }

        if (active) {
          setName(user.name || "");
          setEmail(user.email || "");
          setUsername(user.username || "");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Your name must not exceed 50 characters.");
      return;
    }

    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmedUsername)) {
      setError(
        "Username must be 3–30 characters and contain only letters, numbers, or underscores.",
      );
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          email: trimmedEmail,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Unable to update your profile. Please try again.",
        );
      }

      const user = result.user || result.data?.user;

      setName(user?.name ?? trimmedName);
      setUsername(user?.username ?? trimmedUsername);
      setEmail(user?.email ?? trimmedEmail);

      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.message || "An error occurred while updating your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="animate-pulse text-zinc-400">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="text-sm text-zinc-400 transition hover:text-red-500"
        >
          ← Back to Settings
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
            Account Settings
          </p>

          <h1 className="mt-2 text-3xl font-bold">Edit Profile</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Update your name, username, and email address.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                autoComplete="name"
                required
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                minLength={3}
                maxLength={30}
                autoComplete="username"
                required
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Use 3–30 characters, including letters, numbers, or underscores.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Please use an email address that is not already registered to
                another account.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href="/profile"
                className="rounded-xl border border-white/10 px-6 py-3 text-center font-semibold transition hover:bg-white/5"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
