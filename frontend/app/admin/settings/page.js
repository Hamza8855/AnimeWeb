"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

const defaultSettings = {
  channelName: "Anime Infinite Death",
  channelDescription:
    "Anime rankings, stories, battles, characters and interesting anime content.",
  logo: "",
  youtubeUrl: "https://youtube.com/",
  // githubUrl: "https://github.com/",
  // linkedinUrl: "https://linkedin.com/",
  contactEmail: "razamuhammadtahseen123@gmail.com",
};

export default function AdminSettingsPage() {
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from MongoDB.
  const loadSettings = useCallback(
    async (showNotification = true) => {
      setLoading(true);

      try {
        const result = await apiFetch("/api/settings", {
          method: "GET",
          credentials: "include",
        });

        if (!result.success) {
          throw new Error(result.data?.message || "Unable to load settings.");
        }

        const settings = result.data?.settings;

        if (!settings) {
          throw new Error("Settings data was not returned by the server.");
        }

        setFormData({
          channelName: settings.channelName ?? defaultSettings.channelName,
          channelDescription:
            settings.channelDescription ?? defaultSettings.channelDescription,
          logo: settings.logo ?? "",
          youtubeUrl: settings.youtubeUrl ?? defaultSettings.youtubeUrl,
          githubUrl: settings.githubUrl ?? defaultSettings.githubUrl,
          linkedinUrl: settings.linkedinUrl ?? defaultSettings.linkedinUrl,
          contactEmail: settings.contactEmail ?? defaultSettings.contactEmail,
        });

        if (showNotification) {
          success("Settings loaded successfully.");
        }
      } catch (err) {
        showError(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    },
    [showError, success],
  );

  useEffect(() => {
    loadSettings(false);
  }, [loadSettings]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save settings to MongoDB.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      const result = await apiFetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!result.success) {
        throw new Error(result.data?.message || "Unable to save settings.");
      }

      if (result.data?.settings) {
        setFormData({
          ...defaultSettings,
          ...result.data.settings,
        });
      }

      success("Settings saved successfully.");
    } catch (err) {
      showError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 disabled:opacity-50";

  const renderInput = (id, label, type, placeholder) => (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={formData[id]}
        onChange={handleChange}
        placeholder={placeholder}
        className={inputClass}
        disabled={loading || saving}
        required={id === "channelName" || id === "contactEmail"}
        maxLength={
          id === "channelName"
            ? 100
            : id === "channelDescription"
              ? 1000
              : undefined
        }
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Admin Panel
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Settings</h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Manage your channel information, social links and contact
            information.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-10 text-center text-gray-400">
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Channel Information */}
            <section className="rounded-xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Channel Information</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Basic information about your anime channel.
                </p>
              </div>

              <div className="space-y-5">
                {renderInput(
                  "channelName",
                  "Channel Name",
                  "text",
                  "Enter channel name",
                )}

                <div>
                  <label
                    htmlFor="channelDescription"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Channel Description
                  </label>

                  <textarea
                    id="channelDescription"
                    name="channelDescription"
                    value={formData.channelDescription}
                    onChange={handleChange}
                    rows={5}
                    maxLength={1000}
                    disabled={saving}
                    placeholder="Enter channel description"
                    className={`${inputClass} resize-none leading-6`}
                  />
                </div>

                {renderInput(
                  "logo",
                  "Logo URL",
                  "url",
                  "https://example.com/logo.png",
                )}

                <p className="-mt-3 text-xs text-gray-600">
                  Enter the URL of your channel logo.
                </p>
              </div>
            </section>

            {/* Social Links */}
            <section className="rounded-xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Social Links</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add your official social media and channel links.
                </p>
              </div>

              <div className="space-y-5">
                {renderInput(
                  "youtubeUrl",
                  "YouTube URL",
                  "url",
                  "https://youtube.com/@yourchannel",
                )}

                {renderInput(
                  "githubUrl",
                  "GitHub URL",
                  "url",
                  "https://github.com/username",
                )}

                {renderInput(
                  "linkedinUrl",
                  "LinkedIn URL",
                  "url",
                  "https://linkedin.com/in/username",
                )}
              </div>
            </section>

            {/* Contact Information */}
            <section className="rounded-xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Contact Information</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage the email address visitors can use to contact you.
                </p>
              </div>

              {renderInput(
                "contactEmail",
                "Contact Email",
                "email",
                "contact@example.com",
              )}
            </section>

            {/* Save */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => loadSettings(true)}
                disabled={saving || loading}
                className="rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-red-500 hover:text-white disabled:opacity-50"
              >
                {loading ? "Loading..." : "Reload Settings"}
              </button>

              <button
                type="submit"
                disabled={saving || loading}
                className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
