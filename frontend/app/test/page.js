"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function TestPage() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    const testBackend = async () => {
      const result = await apiFetch("/api/test");

      if (result.success) {
        setMessage(result.data.message);
      } else {
        setMessage(result.data.message || "Backend connection failed");
      }
    };

    testBackend();
  }, []);

  return (
    <main>
      <h1>{message}</h1>
    </main>
  );
}
