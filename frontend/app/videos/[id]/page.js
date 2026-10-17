import Link from "next/link";
import CommentSection from "../../../components/CommentSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getYoutubeId(video) {
  const value = String(video?.youtubeId || video?.youtubeUrl || "").trim();

  if (!value) return "";

  // Direct YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  // YouTube URL
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);

    let id = "";

    if (url.hostname.includes("youtu.be")) {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.searchParams.get("v")) {
      id = url.searchParams.get("v");
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      const index = parts.findIndex((part) =>
        ["embed", "shorts", "live"].includes(part),
      );

      if (index !== -1) {
        id = parts[index + 1] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

async function getVideo(id) {
  try {
    const response = await fetch(
      `${API_URL}/api/videos/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return null;
    }

    return result.video || null;
  } catch (error) {
    console.error("Fetch Video Error:", error);
    return null;
  }
}

export default async function VideoDetails({ params }) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-zinc-950 p-6 text-center sm:p-10">
          <h1 className="text-3xl font-bold sm:text-4xl">Video Not Found</h1>

          <p className="mt-4 text-gray-400">
            This video could not be found. Please try again.
          </p>

          <Link
            href="/videos"
            className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700"
          >
            Back to Videos
          </Link>
        </div>
      </main>
    );
  }

  const youtubeId = getYoutubeId(video);

  const categoryName =
    typeof video.category === "object"
      ? video.category?.name || "Anime"
      : video.category || "Anime";

  const publishedDate = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/videos"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-red-500 sm:mb-8"
        >
          <span aria-hidden="true">←</span>
          Back to Videos
        </Link>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* YouTube Player */}
          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
              <div className="relative aspect-video w-full bg-gray-900">
                {youtubeId ? (
                  <iframe
                    key={youtubeId}
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={video.title || "Anime video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <h2 className="font-bold text-red-500">
                      YouTube Video ID Missing
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Check this video's youtubeId or youtubeUrl in MongoDB.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Information */}
            <div className="mt-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-500 sm:text-sm">
                {categoryName}
              </span>

              <h1 className="mt-3 break-words text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                {video.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span>{Number(video.views || 0).toLocaleString()} views</span>

                {publishedDate && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{publishedDate}</span>
                  </>
                )}
              </div>

              <div className="mt-6 border-t border-gray-800 pt-6">
                <h2 className="text-xl font-bold">About This Video</h2>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-400 sm:text-base">
                  {video.description || "No description available."}
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-xl font-bold">
                    A
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-bold">
                      Anime Infinite Death
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Anime Content Channel
                    </p>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex justify-center rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
                >
                  Contact Channel
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side Panel */}
          <aside className="rounded-xl border border-gray-800 bg-gray-950 p-5">
            <h2 className="text-lg font-bold">Anime Infinite Death</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Discover anime stories, characters, battles and more videos.
            </p>

            <Link
              href="/videos"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-red-600 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-600 hover:text-white"
            >
              Browse All Videos
            </Link>
          </aside>
        </div>

        {/* Comments for this video */}
        <div className="mt-10">
          <CommentSection videoId={String(video._id)} />
        </div>
      </section>

      <section className="border-t border-gray-900 bg-gray-950/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-12 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Keep Watching
            </p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Discover More Anime Videos
            </h2>
          </div>

          <Link
            href="/videos"
            className="inline-flex w-full items-center justify-center rounded-lg border border-red-600 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-600 hover:text-white sm:w-auto"
          >
            View All Videos →
          </Link>
        </div>
      </section>
    </main>
  );
}
