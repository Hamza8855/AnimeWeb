import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-black to-black" />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[600px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Small Heading */}
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            Anime Channel
          </p>

          {/* Main Heading */}
          <h1 className="text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Enter The World Of <span className="text-red-500">Anime</span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
            Welcome to Anime Infinite Death. Discover powerful characters,
            unforgettable battles, anime stories, theories, and exciting content
            from the world of anime.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/videos"
              className="rounded-lg bg-red-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-red-700"
            >
              Explore Videos
            </Link>

            <a
              href="https://www.youtube.com/@Animeinfinitydeath1234"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/20 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Visit YouTube
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
