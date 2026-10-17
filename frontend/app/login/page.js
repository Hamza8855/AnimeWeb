"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const newErrors = {};
    const email = formData.email.trim();

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError("Please correct the highlighted fields.");
      return;
    }

    try {
      setIsLoading(true);

      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password: formData.password,
        }),
      });

      if (!result.success) {
        showError(
          result.status === 401
            ? "Invalid email or password. Please try again."
            : "Login failed. Please check your details and try again.",
        );
        return;
      }

      // The authenticated role must come from the backend.
      const user = result.data?.user || result.data?.data?.user;

      if (!user || !["admin", "user"].includes(user.role)) {
        showError("We couldn't verify your account. Please try again.");
        return;
      }

      success(
        user.role === "admin"
          ? "Admin login successful. Welcome to the dashboard."
          : "Login successful. Welcome back!",
      );

      // Keep the global ToastProvider mounted during navigation.
      router.replace(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      console.error("Login request failed:", err);

      showError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-white sm:px-5 sm:py-12">
      {/* Background Glow */}
      <div className="login-glow pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-red-600/10 blur-[100px] sm:h-[450px] sm:w-[450px] sm:blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="login-header mb-8 text-center">
          <h1 className="mt-4 text-3xl font-bold sm:mt-8 sm:text-4xl">
            Welcome Back
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Login to your account and continue exploring.
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                disabled={isLoading}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full rounded-lg border bg-black px-4 py-3 text-sm text-white outline-none transition duration-300 placeholder:text-gray-600 focus:-translate-y-0.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 ${
                  errors.email ? "border-red-500" : "border-gray-800"
                }`}
              />

              {errors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-300"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-red-500 transition hover:text-red-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={`w-full rounded-lg border bg-black px-4 py-3 pr-20 text-sm text-white outline-none transition duration-300 placeholder:text-gray-600 focus:-translate-y-0.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 ${
                    errors.password ? "border-red-500" : "border-gray-800"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 transition duration-300 hover:scale-105 hover:text-red-500 disabled:opacity-50"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-button group relative w-full overflow-hidden rounded-lg bg-red-600 px-6 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="button-shine absolute inset-0 -translate-x-full bg-white/10" />

              <span className="relative">
                {isLoading ? "Logging in..." : "Login"}
              </span>
            </button>
          </form>

          {/* Signup */}
          <div className="mt-7 border-t border-gray-800 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-red-500 transition hover:text-red-400 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 transition duration-300 hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
