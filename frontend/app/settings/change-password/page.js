"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Tamam password fields fill karo.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password kam az kam 8 characters ka hona chahiye.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password aur confirm password match nahi karte.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password current password se different hona chahiye.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Password change nahi hua.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password successfully change ho gaya.");
    } catch (err) {
      setError(err.message || "Password change karte waqt error aaya.");
    } finally {
      setSaving(false);
    }
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
            Security Settings
          </p>

          <h1 className="mt-2 text-3xl font-bold">Change Password</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Apne account ko secure rakhne ke liye strong password use karo.
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
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Current Password
              </label>

              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black focus-within:border-red-500">
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="px-4 text-sm text-zinc-400 hover:text-white"
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                New Password
              </label>

              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black focus-within:border-red-500">
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  minLength={8}
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="px-4 text-sm text-zinc-400 hover:text-white"
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Password at least 8 characters ka hona chahiye.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Confirm New Password
              </label>

              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black focus-within:border-red-500">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  minLength={8}
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="px-4 text-sm text-zinc-400 hover:text-white"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>

              <Link
                href="/settings"
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
