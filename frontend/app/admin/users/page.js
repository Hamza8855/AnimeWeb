"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PAGE_SIZE = 10;

function normalizeUser(user) {
  return {
    ...user,
    id: String(user._id || user.id),
    name: user.name || "Unnamed User",
    username: user.username || "",
    email: user.email || "",
    role: user.role || "user",
    status: user.isBlocked ? "blocked" : "active",
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A",
  };
}

const buttonClass =
  "rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export default function AdminUsersPage() {
  const { success, error: showError } = useToast();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  // FETCH USERS
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, meResponse] = await Promise.all([
        fetch(`${API_URL}/api/users`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const usersData = await usersResponse.json();

      if (!usersResponse.ok || !usersData.success) {
        throw new Error(usersData.message || "Unable to load users.");
      }

      setUsers((usersData.users || []).map(normalizeUser));

      if (meResponse.ok) {
        const meData = await meResponse.json();
        const me = meData.user || meData.data?.user;

        if (me) {
          setCurrentAdminId(String(me._id || me.id || ""));
        }
      }
    } catch (err) {
      console.error("Admin users load error:", err);

      setError("We couldn't load users. Please try again.");
      showError("We couldn't load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // SEARCH FILTER
  const filteredUsers = users.filter((user) => {
    const searchText = search.trim().toLowerCase();

    return (
      user.name.toLowerCase().includes(searchText) ||
      user.username.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.role.toLowerCase().includes(searchText)
    );
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * PAGE_SIZE;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const activeCount = users.filter((user) => user.status === "active").length;
  const blockedCount = users.filter((user) => user.status === "blocked").length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  const startUser = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const endUser = Math.min(startIndex + PAGE_SIZE, filteredUsers.length);

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  // BLOCK, UNBLOCK, VERIFY OR UNVERIFY
  async function handleUserAction(user, action) {
    if (actionLoading) return;

    if (user.id === currentAdminId) {
      showError("You cannot manage your own admin account.");
      return;
    }

    if (user.role === "admin") {
      showError("Another admin account cannot be managed here.");
      return;
    }

    setActionLoading(user.id);

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update user.");
      }

      if (!data.user) {
        throw new Error("The server did not return the updated user.");
      }

      const updatedUser = normalizeUser(data.user);

      setUsers((previous) =>
        previous.map((item) => (item.id === user.id ? updatedUser : item)),
      );

      setSelectedUser((previous) =>
        previous?.id === user.id ? updatedUser : previous,
      );

      const successMessages = {
        block: "User blocked successfully.",
        unblock: "User unblocked successfully.",
        verify: "User verified successfully.",
        unverify: "User verification removed successfully.",
      };

      success(successMessages[action] || "User updated successfully.");
    } catch (err) {
      console.error("Admin user action error:", err);
      showError(
        err.message || "We couldn't update this user. Please try again.",
      );
    } finally {
      setActionLoading("");
    }
  }

  // DELETE USER
  async function handleDelete(user) {
    if (actionLoading) return;

    if (user.id === currentAdminId || user.role === "admin") {
      showError("Admin accounts are protected.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.name}?`,
    );

    if (!confirmed) return;

    setActionLoading(user.id);

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete user.");
      }

      const remainingUsers = users.filter((item) => item.id !== user.id);

      setUsers(remainingUsers);

      setSelectedUser((previous) =>
        previous?.id === user.id ? null : previous,
      );

      success("User deleted successfully.");

      const query = search.trim().toLowerCase();

      const remainingFiltered = remainingUsers.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.username.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query),
      );

      const newTotalPages = Math.ceil(remainingFiltered.length / PAGE_SIZE);

      if (currentPage > Math.max(newTotalPages, 1)) {
        setCurrentPage(Math.max(newTotalPages, 1));
      }
    } catch (err) {
      console.error("Admin user delete error:", err);

      showError(
        err.message || "We couldn't delete this user. Please try again.",
      );
    } finally {
      setActionLoading("");
    }
  }

  // ACTION BUTTONS
  function renderActions(user) {
    const isProtected = user.id === currentAdminId || user.role === "admin";

    return (
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setSelectedUser(user)}
          className={buttonClass}
        >
          View
        </button>

        {!isProtected ? (
          <>
            <button
              type="button"
              disabled={Boolean(actionLoading)}
              onClick={() =>
                handleUserAction(
                  user,
                  user.status === "blocked" ? "unblock" : "block",
                )
              }
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${
                user.status === "blocked"
                  ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                  : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              }`}
            >
              {actionLoading === user.id
                ? "Please wait..."
                : user.status === "blocked"
                  ? "Unblock"
                  : "Block"}
            </button>

            <button
              type="button"
              disabled={Boolean(actionLoading)}
              onClick={() =>
                handleUserAction(user, user.isVerified ? "unverify" : "verify")
              }
              className={buttonClass}
            >
              {user.isVerified ? "Unverify" : "Verify"}
            </button>

            <button
              type="button"
              disabled={Boolean(actionLoading)}
              onClick={() => handleDelete(user)}
              className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
            >
              {actionLoading === user.id ? "Please wait..." : "Delete"}
            </button>
          </>
        ) : (
          <span className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-600">
            Protected
          </span>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen min-w-0 bg-black px-3 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
            Admin Panel
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            User Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Manage registered users, account status, verification and user
            accounts.
          </p>
        </header>

        {/* STATISTICS */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[
            { label: "Total Users", value: users.length, color: "text-white" },
            {
              label: "Active Users",
              value: activeCount,
              color: "text-green-400",
            },
            {
              label: "Blocked Users",
              value: blockedCount,
              color: "text-red-400",
            },
            {
              label: "Admins",
              value: adminCount,
              color: "text-yellow-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-800 bg-gray-950 p-4 transition duration-300 hover:-translate-y-1 hover:border-red-500/30 sm:p-5"
            >
              <p className="text-xs text-gray-500 sm:text-sm">{stat.label}</p>
              <p
                className={`mt-2 text-2xl font-black sm:text-3xl ${stat.color}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="mb-6">
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, username, email or role..."
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-5 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 sm:max-w-md"
          />

          <p className="mt-2 text-xs text-gray-500">
            Search across the users currently loaded from the API.
          </p>
        </div>

        {/* LOAD ERROR WITH RETRY */}
        {!loading && error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={loadUsers}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-gray-950 px-6 py-16 text-center text-gray-400">
            Loading users from database...
          </div>
        ) : !error || users.length > 0 ? (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-800 bg-gray-950 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b border-gray-800 bg-gray-900/70">
                    <tr>
                      {[
                        "Name",
                        "Email",
                        "Role",
                        "Status",
                        "Verified",
                        "Created Date",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-sm font-semibold text-gray-300 ${
                            heading === "Actions" ? "text-right" : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-800">
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition duration-200 hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/10 font-semibold text-red-500">
                              {user.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="font-medium text-white">
                                {user.name}
                              </p>

                              {user.username && (
                                <p className="mt-1 text-xs text-gray-500">
                                  @{user.username}
                                </p>
                              )}

                              {user.id === currentAdminId && (
                                <p className="mt-1 text-xs text-yellow-500">
                                  You
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-gray-400">
                          {user.email}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.role === "admin"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.status === "active"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm">
                          <span
                            className={
                              user.isVerified
                                ? "text-green-400"
                                : "text-gray-500"
                            }
                          >
                            {user.isVerified ? "Verified" : "Pending"}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm text-gray-500">
                          {user.createdAt}
                        </td>

                        <td className="px-5 py-5">{renderActions(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE AND TABLET CARDS */}
            <div className="space-y-4 lg:hidden">
              {paginatedUsers.map((user) => (
                <article
                  key={user.id}
                  className="rounded-xl border border-gray-800 bg-gray-950 p-4 transition duration-300 hover:border-red-500/30 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600/10 font-semibold text-red-500">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-white">
                        {user.name}
                      </p>

                      {user.username && (
                        <p className="mt-1 text-xs text-gray-500">
                          @{user.username}
                        </p>
                      )}

                      <p className="mt-1 break-all text-sm text-gray-400">
                        {user.email}
                      </p>
                    </div>

                    {user.id === currentAdminId && (
                      <span className="shrink-0 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400">
                        You
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                    <div>
                      <p className="text-xs text-gray-600">Role</p>
                      <p className="mt-1 text-sm text-gray-300">{user.role}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <p
                        className={`mt-1 text-sm ${
                          user.status === "blocked"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {user.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Verification</p>
                      <p className="mt-1 text-sm text-gray-300">
                        {user.isVerified ? "Verified" : "Pending"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Created Date</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {user.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-800 pt-4">
                    {renderActions(user)}
                  </div>
                </article>
              ))}
            </div>

            {/* EMPTY STATE */}
            {filteredUsers.length === 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-950 px-6 py-16 text-center">
                <h2 className="text-xl font-bold">No Users Found</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Try another name, username, email or role.
                </p>
              </div>
            )}

            {/* PAGINATION */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-400">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {startUser}–{endUser}
                  </span>
                  {" of "}
                  <span className="font-semibold text-white">
                    {filteredUsers.length}
                  </span>
                  {" users"}
                  <p className="mt-1 text-xs text-gray-500">
                    Page {safePage} of {Math.max(totalPages, 1)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className={buttonClass}
                  >
                    ← Previous
                  </button>

                  <span className="min-w-8 text-center text-sm font-bold text-white">
                    {safePage}
                  </span>

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">User Details</h2>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-xl text-gray-500 transition hover:text-white"
                aria-label="Close user details"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ["Name", selectedUser.name],
                [
                  "Username",
                  selectedUser.username
                    ? `@${selectedUser.username}`
                    : "Not set",
                ],
                ["Email", selectedUser.email],
                ["Role", selectedUser.role],
                ["Status", selectedUser.status],
                [
                  "Verification",
                  selectedUser.isVerified ? "Verified" : "Pending",
                ],
                ["Created Date", selectedUser.createdAt],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-600">{label}</p>
                  <p className="mt-1 break-words text-sm text-gray-200">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="mt-7 w-full rounded-lg bg-gray-800 px-5 py-3 text-sm font-semibold transition hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
