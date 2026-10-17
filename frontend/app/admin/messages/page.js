"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

const PAGE_SIZE = 10;

export default function AdminMessagesPage() {
  const { success, error: showError } = useToast();

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch actual messages from MongoDB.
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiFetch("/api/contact", {
        method: "GET",
        credentials: "include",
      });

      if (!result?.success) {
        throw new Error(
          result?.data?.message || "Unable to load contact messages.",
        );
      }

      const contacts = result.data?.contacts;

      if (!Array.isArray(contacts)) {
        throw new Error("Invalid messages response.");
      }

      setMessages(contacts);
    } catch (err) {
      console.error("Load Contact Messages Error:", err);

      setError("We couldn't load contact messages. Please try again.");
      showError("We couldn't load contact messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Search messages.
  const filteredMessages = messages.filter((message) => {
    const searchText = search.trim().toLowerCase();

    return (
      (message.name || "").toLowerCase().includes(searchText) ||
      (message.email || "").toLowerCase().includes(searchText) ||
      (message.subject || "").toLowerCase().includes(searchText) ||
      (message.message || "").toLowerCase().includes(searchText)
    );
  });

  // Pagination calculations.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMessages.length / PAGE_SIZE),
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedMessages = filteredMessages.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const firstMessage = filteredMessages.length === 0 ? 0 : startIndex + 1;

  const lastMessage = Math.min(startIndex + PAGE_SIZE, filteredMessages.length);

  // Reset page when search changes.
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  // Keep current page valid after deleting messages or filtering.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Open a message and automatically mark it as read.
  const handleViewMessage = async (message) => {
    setSelectedMessage(message);

    if (message.status === "unread") {
      await handleStatusChange(message._id, "read");
    }
  };

  // Update message status in the backend and MongoDB.
  const handleStatusChange = async (id, newStatus) => {
    if (!id || actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      const result = await apiFetch("/api/contact", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });

      if (!result?.success) {
        throw new Error(
          result?.data?.message || "Unable to update message status.",
        );
      }

      const updatedContact = result.data?.contact;

      setMessages((previous) =>
        previous.map((message) =>
          message._id === id
            ? {
                ...message,
                ...(updatedContact || {}),
                status: newStatus,
              }
            : message,
        ),
      );

      setSelectedMessage((previous) =>
        previous?._id === id
          ? {
              ...previous,
              ...(updatedContact || {}),
              status: newStatus,
            }
          : previous,
      );

      success(
        newStatus === "resolved"
          ? "Message marked as resolved."
          : newStatus === "read"
            ? "Message marked as read."
            : "Message marked as unread.",
      );
    } catch (err) {
      console.error("Update Contact Message Error:", err);

      showError("We couldn't update this message. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a message from MongoDB.
  const handleDelete = async (message) => {
    if (!message?._id || actionLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this message?",
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const result = await apiFetch("/api/contact", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: message._id }),
      });

      if (!result?.success) {
        throw new Error(
          result?.data?.message || "Unable to delete contact message.",
        );
      }

      setMessages((previous) =>
        previous.filter((item) => item._id !== message._id),
      );

      setSelectedMessage((previous) =>
        previous?._id === message._id ? null : previous,
      );

      success("Contact message deleted successfully.");
    } catch (err) {
      console.error("Delete Contact Message Error:", err);

      showError("We couldn't delete this message. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "unread":
        return "border-red-500/20 bg-red-500/10 text-red-400";
      case "read":
        return "border-blue-500/20 bg-blue-500/10 text-blue-400";
      case "resolved":
        return "border-green-500/20 bg-green-500/10 text-green-400";
      default:
        return "border-gray-500/20 bg-gray-500/10 text-gray-400";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "unread":
        return "Unread";
      case "read":
        return "Read";
      case "resolved":
        return "Resolved";
      default:
        return status || "Unknown";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleString();
  };

  const unreadMessages = messages.filter(
    (message) => message.status === "unread",
  ).length;

  const readMessages = messages.filter(
    (message) => message.status === "read",
  ).length;

  const resolvedMessages = messages.filter(
    (message) => message.status === "resolved",
  ).length;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Contact Messages</h1>
            <p className="mt-2 text-sm text-gray-400 sm:text-base">
              Manage messages received from website users.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMessages}
            disabled={loading || actionLoading}
            className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Messages"}
          </button>
        </div>

        {/* Load error with retry */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-200/80">
              Check that you are logged in as an admin and the backend is
              running.
            </p>
            <button
              type="button"
              onClick={loadMessages}
              disabled={loading}
              className="mt-3 rounded-lg border border-red-500/40 px-3 py-2 font-medium hover:bg-red-500/10 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Try Again"}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Total Messages</p>
            <h2 className="mt-2 text-3xl font-bold">{messages.length}</h2>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Unread</p>
            <h2 className="mt-2 text-3xl font-bold text-red-400">
              {unreadMessages}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Read</p>
            <h2 className="mt-2 text-3xl font-bold text-blue-400">
              {readMessages}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Resolved</p>
            <h2 className="mt-2 text-3xl font-bold text-green-400">
              {resolvedMessages}
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="search"
            placeholder="Search by name, email, subject or message..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-gray-800 bg-gray-900 px-5 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-red-500"
          />
        </div>

        {/* Messages */}
        {loading ? (
          <div
            role="status"
            className="rounded-xl border border-gray-800 bg-gray-900 py-16 text-center text-gray-400"
          >
            Loading contact messages...
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-800 bg-gray-900 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="border-b border-gray-800 bg-gray-950">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold">Name</th>
                      <th className="px-6 py-4 text-sm font-semibold">Email</th>
                      <th className="px-6 py-4 text-sm font-semibold">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold">
                        Message
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedMessages.map((message) => (
                      <tr
                        key={message._id}
                        className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40"
                      >
                        <td className="px-6 py-5 font-medium">
                          {message.name}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-400">
                          {message.email}
                        </td>

                        <td className="px-6 py-5">
                          <p className="max-w-[180px] truncate font-medium">
                            {message.subject}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="max-w-[250px] truncate text-sm text-gray-400">
                            {message.message}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-400">
                          {formatDate(message.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(message.status)}`}
                          >
                            {getStatusText(message.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewMessage(message)}
                              className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-red-500 hover:text-white"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(message)}
                              disabled={actionLoading}
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
              {paginatedMessages.map((message) => (
                <div
                  key={message._id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold">
                        {message.name}
                      </h3>
                      <p className="mt-1 break-all text-xs text-gray-500">
                        {message.email}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(message.status)}`}
                    >
                      {getStatusText(message.status)}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs text-gray-500">Subject</p>
                    <p className="mt-1 break-words font-medium">
                      {message.subject}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-gray-500">Message</p>
                    <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-gray-400">
                      {message.message}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4">
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewMessage(message)}
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-red-500 hover:text-white"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(message)}
                        disabled={actionLoading}
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredMessages.length === 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 py-16 text-center">
                <h2 className="text-xl font-semibold">
                  {search ? "No messages found" : "No contact messages yet"}
                </h2>
                <p className="mt-2 px-4 text-sm text-gray-500">
                  {search
                    ? "Try searching with a different name, email or subject."
                    : "Messages submitted through your contact form will appear here."}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredMessages.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {firstMessage}-{lastMessage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {filteredMessages.length}
                  </span>{" "}
                  messages
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-2 text-sm text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message Details Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setSelectedMessage(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Message Details</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Contact message information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                disabled={actionLoading}
                aria-label="Close message details"
                className="rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </p>
                <p className="mt-1 break-words">{selectedMessage.name}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Email
                </p>
                <p className="mt-1 break-all text-gray-300">
                  {selectedMessage.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Subject
                </p>
                <p className="mt-1 break-words font-medium">
                  {selectedMessage.subject}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Date
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {formatDate(selectedMessage.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Message
                </p>
                <div className="mt-2 rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(selectedMessage.status)}`}
                >
                  {getStatusText(selectedMessage.status)}
                </span>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Update Status</p>
                <div className="flex flex-wrap gap-3">
                  {["unread", "read", "resolved"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        handleStatusChange(selectedMessage._id, status)
                      }
                      disabled={
                        actionLoading || selectedMessage.status === status
                      }
                      className={`rounded-lg border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${getStatusClasses(status)}`}
                    >
                      {actionLoading
                        ? "Updating..."
                        : status === "unread"
                          ? "Mark Unread"
                          : status === "read"
                            ? "Mark Read"
                            : "Mark Resolved"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-gray-800 pt-5">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedMessage)}
                  disabled={actionLoading}
                  className="rounded-lg border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  Delete Message
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
