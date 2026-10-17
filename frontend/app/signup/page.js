"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function SignupPage() {
  const { success, error: showError } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const validateForm = () => {
    const newErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      newErrors.name = "Name is required.";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (name.length > 50) {
      newErrors.name = "Name cannot exceed 50 characters.";
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError("Please correct the highlighted fields.");
      return;
    }

    try {
      setIsLoading(true);

      const result = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      if (!result.success) {
        const status = result.status;
        const message = result.data?.message;

        if (status === 409) {
          showError("An account with this email already exists.");
        } else if (status === 400 && message) {
          showError(message);
        } else {
          showError("We couldn't create your account. Please try again.");
        }

        return;
      }

      success(
        result.data?.message ||
          "Your account has been created successfully. You can now log in.",
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setErrors({});
    } catch (err) {
      console.error("Signup request failed:", err);

      showError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-white sm:px-6 sm:py-12">
      {/* Background Glow */}
      <div className="signup-glow pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-red-600/10 blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="signup-header mb-8 text-center">
          <h1 className="mt-4 text-3xl font-bold sm:mt-8 sm:text-4xl">
            Create Account
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Join Anime Infinite Death and explore our content.
          </p>
        </div>

        {/* Signup Card */}
        <div className="signup-card rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={isLoading}
                aria-invalid={Boolean(errors.name)}
                className={`w-full rounded-lg border bg-black px-4 py-3 text-sm text-white outline-none transition duration-300 placeholder:text-gray-600 focus:-translate-y-0.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 ${
                  errors.name ? "border-red-500" : "border-gray-800"
                }`}
              />

              {errors.name && (
                <p className="mt-2 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

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
                className={`w-full rounded-lg border bg-black px-4 py-3 text-sm text-white outline-none transition duration-300 placeholder:text-gray-600 focus:-translate-y-0.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 ${
                  errors.email ? "border-red-500" : "border-gray-800"
                }`}
              />

              {errors.email && (
                <p className="mt-2 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.password)}
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
                <p className="mt-2 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={`w-full rounded-lg border bg-black px-4 py-3 pr-20 text-sm text-white outline-none transition duration-300 placeholder:text-gray-600 focus:-translate-y-0.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-800"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isLoading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 transition duration-300 hover:scale-105 hover:text-red-500 disabled:opacity-50"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="signup-button group relative w-full overflow-hidden rounded-lg bg-red-600 px-6 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="button-shine absolute inset-0 -translate-x-full bg-white/10" />

              <span className="relative">
                {isLoading ? "Creating Account..." : "Create Account"}
              </span>
            </button>
          </form>

          {/* Login */}
          <div className="mt-7 border-t border-gray-800 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-red-500 transition duration-300 hover:text-red-400 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Back Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 transition duration-300 hover:text-white hover:tracking-wide"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
