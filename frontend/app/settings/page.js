"use client";

import Link from "next/link";

const settingsOptions = [
  {
    title: "Edit Profile",
    description: "Update your name and manage your profile information.",
    icon: "👤",
    href: "/settings/edit-profile",
    color: "from-red-600/20 to-red-900/5",
  },
  {
    title: "Change Password",
    description: "Change your current password to keep your account secure.",
    icon: "🔒",
    href: "/settings/change-password",
    color: "from-blue-600/20 to-blue-900/5",
  },
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-10">
          <Link
            href="/profile"
            className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-red-500"
          >
            <span aria-hidden="true">←</span>
            Back to Profile
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
            Account Preferences
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">Settings</h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Manage your account information, password, and account security from
            one place.
          </p>
        </div>

        {/* Settings Options */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {settingsOptions.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${option.color} p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-950/20`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-2xl">
                  {option.icon}
                </div>

                <span className="text-xl text-zinc-500 transition group-hover:translate-x-1 group-hover:text-red-500">
                  →
                </span>
              </div>

              <h2 className="text-xl font-semibold transition group-hover:text-red-500">
                {option.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {option.description}
              </p>

              <div className="mt-6 text-sm font-medium text-red-500">
                Manage settings
              </div>
            </Link>
          ))}
        </div>

        {/* Security Information */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-950 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-xl">
              🛡️
            </div>

            <div>
              <h2 className="font-semibold">Account Security</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Keep your account secure by using a strong password and keeping
                your profile information up to date.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
