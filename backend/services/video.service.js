import Video from "@/models/Video";

// Get all published videos
export const getAllVideos = async () => {
  return await Video.find({ status: "published" })
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

// Get all videos for admin
export const getAllVideosForAdmin = async () => {
  return await Video.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

// Get single video by ID
export const findVideoById = async (videoId) => {
  return await Video.findById(videoId).populate("category", "name slug");
};

// Get videos by category
export const getVideosByCategory = async (categoryId) => {
  return await Video.find({
    category: categoryId,
    status: "published",
  })
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

// Get featured videos
export const getFeaturedVideos = async () => {
  return await Video.find({
    status: "published",
    isFeatured: true,
  })
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

// Create video
export const createVideo = async (videoData) => {
  return await Video.create(videoData);
};

// Update video
export const updateVideo = async (videoId, updateData) => {
  return await Video.findByIdAndUpdate(videoId, updateData, {
    new: true,
    runValidators: true,
  }).populate("category", "name slug");
};

// Delete video
export const deleteVideo = async (videoId) => {
  return await Video.findByIdAndDelete(videoId);
};

// Increment video views
export const incrementViews = async (videoId) => {
  return await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    },
  );
};

// Set video as featured
export const setFeaturedVideo = async (videoId) => {
  return await Video.findByIdAndUpdate(
    videoId,
    {
      isFeatured: true,
    },
    {
      new: true,
    },
  ).populate("category", "name slug");
};

// Remove video from featured
export const removeFeaturedVideo = async (videoId) => {
  return await Video.findByIdAndUpdate(
    videoId,
    {
      isFeatured: false,
    },
    {
      new: true,
    },
  ).populate("category", "name slug");
};

// Publish video
export const publishVideo = async (videoId) => {
  return await Video.findByIdAndUpdate(
    videoId,
    {
      status: "published",
      publishedAt: new Date(),
    },
    {
      new: true,
    },
  ).populate("category", "name slug");
};

// Unpublish video
export const unpublishVideo = async (videoId) => {
  return await Video.findByIdAndUpdate(
    videoId,
    {
      status: "draft",
      publishedAt: null,
    },
    {
      new: true,
    },
  ).populate("category", "name slug");
};
