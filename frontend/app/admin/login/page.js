"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  // Form ke andar email aur password ko store karne ke liye states.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // API request ke waqt button ko disable karne ke liye.
  const [isLoading, setIsLoading] = useState(false);

  // Login fail hone par error message yahan show hoga.
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Purana error clear kar rahe hain.
    setError("");

    // Login request start.
    setIsLoading(true);

    try {
      // Hum existing login API ko use kar rahe hain.
      // Backend already email/password verify karta hai aur token cookie mein save karta hai.
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        // Ye bohat important hai.
        // Isse backend ki httpOnly token cookie browser mein save hogi.
        credentials: "include",

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      // Agar login API ne error return kiya.
      if (!response.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      // Login successful hai, lekin admin hone ki confirmation
      // hum /api/auth/me se karenge.
      const meResponse = await fetch("http://localhost:3001/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      const meData = await meResponse.json();

      // Agar current user fetch nahi hua.
      if (!meResponse.ok || !meData.success) {
        setError("Unable to verify admin account.");
        return;
      }

      // IMPORTANT:
      // Sirf admin role wala user admin panel access kar sakta hai.
      if (meData.user?.role !== "admin") {
        setError("Access denied. You are not an admin.");
        return;
      }

      // Admin verify ho gaya.
      // Ab dashboard par redirect kar rahe hain.
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Admin Login Error:", error);

      // Server/backend connection problem.
      setError("Unable to connect to the server. Please try again.");
    } finally {
      // Request complete hone ke baad loading false.
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8">
        {/* =====================================================
            ADMIN LOGIN HEADER
            ===================================================== */}

        <div className="mb-8 text-center">
          {/* Admin icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl font-bold">
            A
          </div>

          <h1 className="mt-5 text-3xl font-bold">Admin Login</h1>

          <p className="mt-2 text-sm text-gray-500">
            Login to access the admin panel
          </p>
        </div>

        {/* =====================================================
            ERROR MESSAGE
            Backend ya admin verification mein error aaye to
            ye message user ko show hoga.
            ===================================================== */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* =====================================================
            LOGIN FORM
            ===================================================== */}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Checking Admin..." : "Login as Admin"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Admin access only
        </p>
      </div>
    </main>
  );
}
