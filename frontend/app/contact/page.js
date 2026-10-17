"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

const initialFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setStatus("");
    setStatusMessage("");
  };

  const validateForm = () => {
    const newErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name) {
      newErrors.name = "Name is required.";
    } else if (name.length < 2 || name.length > 50) {
      newErrors.name = "Name must be between 2 and 50 characters.";
    }

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (email.length > 254) {
      newErrors.email = "Email address is too long.";
    }

    if (!subject) {
      newErrors.subject = "Subject is required.";
    } else if (subject.length < 3 || subject.length > 150) {
      newErrors.subject = "Subject must be between 3 and 150 characters.";
    }

    if (!message) {
      newErrors.message = "Message is required.";
    } else if (message.length < 10 || message.length > 3000) {
      newErrors.message = "Message must be between 10 and 3000 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus("");
    setStatusMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      if (!result.success) {
        throw new Error(result.data?.message || "Unable to send your message.");
      }

      setFormData(initialFormData);
      setErrors({});
      setStatus("success");
      setStatusMessage(result.data?.message || "Message sent successfully.");
    } catch (error) {
      console.error("Contact Form Error:", error);

      setStatus("error");
      setStatusMessage(
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-lg border bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 ${
      errors[field] ? "border-red-500" : "border-gray-800"
    }`;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-red-950/30 to-black">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
            Anime Infinite Death
          </p>

          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Contact Us
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
            Have a question, suggestion, or feedback? Send us a message and
            we&apos;ll get back to you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-7 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Get In Touch
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              We&apos;d love to hear from you
            </h2>

            <p className="mt-5 leading-7 text-gray-400">
              Whether you have feedback about our videos, a content idea, or
              simply want to reach out, use the form to send us a message.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600/10 text-red-500">
                  ✉
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold">Email</h3>
                  <p className="mt-1 break-all text-sm text-gray-500">
                    razamuhammadtahseen123@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600/10 text-red-500">
                  ▶
                </div>

                <div>
                  <h3 className="font-semibold">YouTube Channel</h3>
                  <a
                    href="https://www.youtube.com/@Animeinfinitydeath1234"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm text-gray-500 transition hover:text-red-400"
                  >
                    Anime Infinite Death
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600/10 text-red-500">
                  ⏱
                </div>

                <div>
                  <h3 className="font-semibold">Response Time</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    We&apos;ll try to respond as soon as possible.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-7 sm:p-9">
            <h2 className="text-2xl font-bold">Send a Message</h2>

            <p className="mt-2 text-sm text-gray-500">
              Fill out the form below and send us your message.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Name
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={50}
                  disabled={isLoading}
                  placeholder="Enter your name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={inputClass("name")}
                />

                {errors.name && (
                  <p id="name-error" className="mt-2 text-sm text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Email
                </label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={254}
                  disabled={isLoading}
                  placeholder="Enter your email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass("email")}
                />

                {errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Subject
                </label>

                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  maxLength={150}
                  disabled={isLoading}
                  placeholder="What is this about?"
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={
                    errors.subject ? "subject-error" : undefined
                  }
                  className={inputClass("subject")}
                />

                {errors.subject && (
                  <p id="subject-error" className="mt-2 text-sm text-red-500">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Message
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={3000}
                  disabled={isLoading}
                  placeholder="Write your message..."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "message-error" : undefined
                  }
                  className={`${inputClass("message")} resize-y`}
                />

                <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500">
                  {errors.message ? (
                    <p id="message-error" className="text-sm text-red-500">
                      {errors.message}
                    </p>
                  ) : (
                    <span>Minimum 10 characters</span>
                  )}

                  <span className="shrink-0">
                    {formData.message.length}/3000
                  </span>
                </div>
              </div>

              {statusMessage && (
                <div
                  role={status === "success" ? "status" : "alert"}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    status === "success"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-red-600 px-6 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
