import { Suspense } from "react";
import VideosClient from "./VideosClient";

export default function VideosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black px-6 py-16 text-center text-gray-400">
          Loading videos...
        </main>
      }
    >
      <VideosClient />
    </Suspense>
  );
}
