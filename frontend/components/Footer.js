import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-gray-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {/* Brand */}
        <div>
          <Link href="/" className="text-xl font-bold text-white">
            Anime <span className="text-red-500">Infinite Death</span>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-6">
            Explore anime content, latest videos, characters, stories, and more
            from Anime Infinite Death.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h3>

          <div className="flex flex-col gap-3 text-sm">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>

            <Link href="/videos" className="transition hover:text-white">
              Videos
            </Link>

            <Link href="/categories" className="transition hover:text-white">
              Categories
            </Link>

            <Link href="/about" className="transition hover:text-white">
              About
            </Link>

            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>

        {/* YouTube */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Follow Us
          </h3>

          <p className="mb-4 text-sm leading-6">
            Watch our latest anime videos on YouTube.
          </p>

          <a
            href="https://www.youtube.com/@Animeinfinitydeath1234"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Visit YouTube
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 md:text-left">
          <p>
            © {new Date().getFullYear()} Anime Infinite Death. All rights
            reserved.
          </p>

          <p>Built with Next.js & React</p>
        </div>
      </div>
    </footer>
  );
}
