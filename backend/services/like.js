import Like from "@/models/Like";
import Video from "@/models/Video";

// Check whether a user has liked a video
export const findLike = async (userId, videoId) => {
  return await Like.findOne({
    user: userId,
    video: videoId,
  });
};

// Get all likes of a video
export const getVideoLikes = async (videoId) => {
  return await Like.find({
    video: videoId,
  }).populate("user", "name username avatar");
};

// Get total likes of a video
export const getLikeCount = async (videoId) => {
  return await Like.countDocuments({
    video: videoId,
  });
};

// Like a video
export const likeVideo = async (userId, videoId) => {
  // Check whether video exists
  const video = await Video.findById(videoId);

  if (!video) {
    throw new Error("Video not found");
  }

  // Check whether user already liked this video
  const existingLike = await Like.findOne({
    user: userId,
    video: videoId,
  });

  if (existingLike) {
    throw new Error("You have already liked this video");
  }

  // Create like
  const like = await Like.create({
    user: userId,
    video: videoId,
  });

  // Increase total likes in Video
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      likes: 1,
    },
  });

  return like;
};

// Unlike a video
export const unlikeVideo = async (userId, videoId) => {
  // Find user's like
  const existingLike = await Like.findOne({
    user: userId,
    video: videoId,
  });

  if (!existingLike) {
    throw new Error("You have not liked this video");
  }

  // Delete like
  await Like.findByIdAndDelete(existingLike._id);

  // Decrease total likes in Video
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      likes: -1,
    },
  });

  return true;
};

// Check if user liked a video
export const hasUserLikedVideo = async (userId, videoId) => {
  const like = await Like.findOne({
    user: userId,
    video: videoId,
  });

  return !!like;
};
