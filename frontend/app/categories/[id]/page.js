import Link from "next/link";
import VideoGrid from "../../../components/VideoGrid";

const videos = [
  {
    id: 1,
    title: "The Strongest Anime Characters Ranked",
    category: "Characters",
    views: "125K",
    duration: "12:45",
    image: "/images/anime-1.jpg",
  },
  {
    id: 2,
    title: "Top 10 Anime Battles You Must Watch",
    category: "Battles",
    views: "98K",
    duration: "10:21",
    image: "/images/anime-2.jpg",
  },
  {
    id: 3,
    title: "Darkest Anime Stories Explained",
    category: "Stories",
    views: "76K",
    duration: "15:08",
    image: "/images/anime-3.jpg",
  },
  {
    id: 4,
    title: "Most Powerful Anime Villains",
    category: "Characters",
    views: "64K",
    duration: "11:32",
    image: "/images/anime-1.jpg",
  },
  {
    id: 5,
    title: "Best Anime Fights of All Time",
    category: "Battles",
    views: "82K",
    duration: "14:16",
    image: "/images/anime-2.jpg",
  },
  {
    id: 6,
    title: "Anime Stories That Will Shock You",
    category: "Stories",
    views: "53K",
    duration: "09:48",
    image: "/images/anime-3.jpg",
  },
];

const categoryInfo = {
  characters: {
    title: "Anime Characters",
    description:
      "Explore powerful heroes, villains, rivals and unforgettable characters from the world of anime.",
  },

  battles: {
    title: "Anime Battles",
    description:
      "Discover exciting anime battles, powerful abilities, legendary rivalries and unforgettable fights.",
  },

  stories: {
    title: "Anime Stories",
    description:
      "Explore interesting anime stories, dark moments, powerful journeys and unforgettable worlds.",
  },

  "top-anime": {
    title: "Top Anime",
    description:
      "Discover some of the most interesting and memorable anime content, characters and moments.",
  },
};

export default async function CategoryPage({ params }) {
  const { id } = await params;

  const category = id.toLowerCase();

  const info = categoryInfo[category];

  if (!info) {
    return (
      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            Category Not Found
          </p>

          <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
            Category Does Not Exist
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            The category you are looking for could not be found.
          </p>

          <Link
            href="/categories"
            className="mt-8 inline-block rounded-xl bg-red-600 px-7 py-3 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-red-700"
          >
            Back To Categories
          </Link>
        </div>
      </main>
    );
  }

  const categoryVideos = videos.filter(
    (video) => video.category.toLowerCase() === category.replace("-", " "),
  );

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-black to-black" />

        <div className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-red-600/10 blur-3xl animate-pulse" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8 lg:py-28">
          <div className="max-w-3xl animate-[fadeIn_0.8s_ease-out]">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-red-500"
            >
              ← All Categories
            </Link>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
              Category
            </p>

            <h1 className="mt-4 text-4xl font-black sm:text-5xl lg:text-6xl">
              {info.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
              {info.description}
            </p>
          </div>
        </div>
      </section>

      {/* Videos */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8 lg:py-28">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Videos
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Explore {info.title}
            </h2>
          </div>

          <p className="text-sm text-gray-500">
            {categoryVideos.length} videos available
          </p>
        </div>

        <VideoGrid videos={categoryVideos} />
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Explore More Categories
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-400">
            Discover more anime characters, battles, stories and other
            interesting content.
          </p>

          <Link
            href="/categories"
            className="mt-8 inline-block rounded-xl bg-red-600 px-8 py-3.5 font-semibold transition duration-300 hover:-translate-y-1 hover:bg-red-700"
          >
            View All Categories
          </Link>
        </div>
      </section>
    </main>
  );
}
