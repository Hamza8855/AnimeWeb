import VideoCard from "./VideoCard";

export default function VideoGrid({ videos }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-950 px-6 py-16 text-center">
        {" "}
        <p className="text-gray-500">No videos found.</p>{" "}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video._id || video.id} video={video} />
      ))}{" "}
    </div>
  );
}
