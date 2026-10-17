"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden border-b border-white/10">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-black" />

        <div className="absolute -left-32 top-20 h-72 w-72 animate-pulse rounded-full bg-red-600/10 blur-3xl" />

        <div
          className="absolute -right-32 bottom-10 h-80 w-80 animate-pulse rounded-full bg-red-800/10 blur-3xl"
          style={{ animationDelay: "1s" }}
        />

        {/* Content */}
        <div
          className={`relative mx-auto w-full max-w-7xl px-6 py-24 transition-all duration-1000 lg:px-8 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-red-500">
              About
            </p>

            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
              Welcome To The World Of{" "}
              <span className="text-red-500">Anime</span>
            </h1>

            <p className="mt-7 max-w-3xl text-base leading-8 text-gray-400 sm:text-lg">
              Anime Infinite Death is a channel created for anime fans who enjoy
              powerful characters, exciting battles, memorable stories,
              interesting facts, theories and discussions from the world of
              anime.
            </p>
          </div>
        </div>
      </section>

      {/* About The Channel */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-8 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Left */}
          <div className="animate-[fadeIn_1s_ease-out]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
              Who We Are
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              About The Channel
            </h2>

            <div className="mt-8 space-y-6 text-base leading-8 text-gray-400 sm:text-lg">
              <p>
                Anime Infinite Death is an anime-focused YouTube channel
                dedicated to creating entertaining and informative content for
                anime lovers.
              </p>

              <p>
                Our content explores different aspects of anime, including
                iconic characters, powerful abilities, unforgettable battles,
                interesting stories, villains, heroes and moments that make
                anime special.
              </p>

              <p>
                The goal is to create a place where anime fans can discover
                interesting content, learn something new and enjoy discussions
                about some of the most memorable anime worlds and characters.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="group relative">
            <div className="absolute -inset-1 rounded-3xl bg-red-600/20 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />

            <div className="relative rounded-3xl border border-white/10 bg-zinc-950 p-8 transition duration-500 hover:-translate-y-2 hover:border-red-500/30 sm:p-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/10 text-3xl transition duration-500 group-hover:scale-110">
                ⚡
              </div>

              <h3 className="mt-7 text-2xl font-bold">Built For Anime Fans</h3>

              <p className="mt-4 leading-7 text-gray-400">
                From character discussions to exciting battles and stories, our
                content is designed around the things anime fans love exploring
                and talking about.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Channel Mission */}
      <section className="border-y border-white/10 bg-zinc-950/60">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
              Our Purpose
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Channel Mission
            </h2>

            <p className="mt-7 text-base leading-8 text-gray-400 sm:text-lg">
              Our mission is to build an engaging anime community by sharing
              entertaining, informative and interesting content that gives
              viewers a reason to discover more about their favorite anime.
            </p>
          </div>

          {/* Mission Cards */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="group rounded-2xl border border-white/10 bg-black p-7 transition-all duration-500 hover:-translate-y-3 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-950/30">
              <div className="text-3xl transition duration-500 group-hover:scale-110">
                🎬
              </div>

              <h3 className="mt-6 text-xl font-bold">Entertaining Content</h3>

              <p className="mt-4 leading-7 text-gray-400">
                Create anime content that is enjoyable, exciting and keeps
                viewers interested from beginning to end.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-black p-7 transition-all duration-500 hover:-translate-y-3 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-950/30">
              <div className="text-3xl transition duration-500 group-hover:scale-110">
                💡
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Interesting Information
              </h3>

              <p className="mt-4 leading-7 text-gray-400">
                Explore characters, stories, battles and anime facts in a way
                that helps viewers discover something interesting.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-black p-7 transition-all duration-500 hover:-translate-y-3 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-950/30 sm:col-span-2 lg:col-span-1">
              <div className="text-3xl transition duration-500 group-hover:scale-110">
                🤝
              </div>

              <h3 className="mt-6 text-xl font-bold">Anime Community</h3>

              <p className="mt-4 leading-7 text-gray-400">
                Create a place where anime fans can enjoy content and share
                their interest in the anime world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Teach */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            Explore
          </p>

          <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            What We Cover
          </h2>

          <p className="mt-6 text-base leading-8 text-gray-400 sm:text-lg">
            Our content focuses on different areas of anime so viewers can
            explore characters, stories, battles and other interesting topics.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: "👤",
              title: "Characters",
              text: "Explore powerful heroes, villains and memorable anime characters.",
            },
            {
              icon: "⚔️",
              title: "Battles",
              text: "Discover exciting battles, abilities, rivalries and legendary moments.",
            },
            {
              icon: "📖",
              title: "Stories",
              text: "Explore interesting anime stories, worlds and unforgettable moments.",
            },
            {
              icon: "🔥",
              title: "Anime Facts",
              text: "Discover interesting information and facts from different anime.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-white/10 bg-zinc-950 p-7 transition-all duration-500 hover:-translate-y-2 hover:border-red-500/40"
            >
              <div className="text-4xl transition duration-500 group-hover:scale-110">
                {item.icon}
              </div>

              <h3 className="mt-6 text-xl font-bold">{item.title}</h3>

              <p className="mt-4 text-sm leading-7 text-gray-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Follow */}
      <section className="border-y border-white/10 bg-gradient-to-b from-zinc-950 to-black">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-8 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
                Join The Journey
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
                Why Follow This Channel?
              </h2>

              <p className="mt-7 text-base leading-8 text-gray-400 sm:text-lg">
                If you enjoy anime and want to explore characters, battles,
                stories and interesting anime content, Anime Infinite Death
                brings different topics together in one place.
              </p>
            </div>

            <div className="space-y-5">
              {[
                "Interesting anime discussions",
                "Powerful characters and abilities",
                "Exciting battles and rivalries",
                "Anime stories and facts",
                "Regular new content",
              ].map((item, index) => (
                <div
                  key={item}
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-950 p-5 transition duration-300 hover:translate-x-2 hover:border-red-500/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-sm font-bold text-red-500">
                    {index + 1}
                  </span>

                  <span className="text-gray-300 transition group-hover:text-white">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Categories */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-8 lg:py-32">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            Content
          </p>

          <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Our Content Categories
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
          {[
            "Anime Characters",
            "Anime Battles",
            "Anime Stories",
            "Power Rankings",
            "Anime Villains",
            "Interesting Anime Facts",
          ].map((category) => (
            <div
              key={category}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-red-500/40"
            >
              <span className="font-semibold text-gray-300 transition group-hover:text-white">
                {category}
              </span>

              <span className="text-xl text-red-500 transition duration-500 group-hover:translate-x-2">
                →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center sm:py-28 lg:px-8 lg:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            Connect With Us
          </p>

          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Follow The Journey
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-gray-400">
            Stay connected and explore Anime Infinite Death across our
            platforms.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="https://www.youtube.com/@Animeinfinitydeath1234"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-red-600 px-7 py-3 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-red-700"
            >
              YouTube
            </a>

            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 px-7 py-3 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              GitHub
            </a>

            <a
              href="https:anime.oia.bio/Death"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 px-7 py-3 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/30 via-black to-red-950/20" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-28">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready To Explore?
          </h2>

          <p className="mt-5 text-gray-400">
            Discover our anime videos and explore different categories.
          </p>

          <Link
            href="/videos"
            className="mt-8 inline-block rounded-xl bg-red-600 px-8 py-3.5 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-red-700"
          >
            Explore Videos
          </Link>
        </div>
      </section>
    </main>
  );
}
