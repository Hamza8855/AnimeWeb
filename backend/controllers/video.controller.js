import {
  getAllVideos,
  getAllVideosForAdmin,
  findVideoById,
  getVideosByCategory,
  getFeaturedVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementViews,
  setFeaturedVideo,
  removeFeaturedVideo,
  publishVideo,
  unpublishVideo,
} from "@/services/video.service";

// ========================================
// GET ALL PUBLISHED VIDEOS
// ========================================

export const getVideos = async () => {
  try {
    const videos = await getAllVideos();

    return {
      success: true,
      status: 200,
      message: "Videos fetched successfully",
      videos,
    };
  } catch (error) {
    console.error("Get Videos Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch videos",
    };
  }
};

// ========================================
// GET ALL VIDEOS FOR ADMIN
// ========================================

export const getAdminVideos = async () => {
  try {
    const videos = await getAllVideosForAdmin();

    return {
      success: true,
      status: 200,
      message: "Admin videos fetched successfully",
      videos,
    };
  } catch (error) {
    console.error("Get Admin Videos Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch videos",
    };
  }
};

// ========================================
// GET SINGLE VIDEO
// ========================================

export const getVideo = async (videoId) => {
  try {
    const video = await findVideoById(videoId);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    // Draft videos normal users ko nahi dikhne chahiye
    if (video.status !== "published") {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video fetched successfully",
      video,
    };
  } catch (error) {
    console.error("Get Video Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch video",
    };
  }
};

// ========================================
// GET VIDEO BY CATEGORY
// ========================================

export const getCategoryVideos = async (categoryId) => {
  try {
    const videos = await getVideosByCategory(categoryId);

    return {
      success: true,
      status: 200,
      message: "Category videos fetched successfully",
      videos,
    };
  } catch (error) {
    console.error("Get Category Videos Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch category videos",
    };
  }
};

// ========================================
// GET FEATURED VIDEOS
// ========================================

export const getFeatured = async () => {
  try {
    const videos = await getFeaturedVideos();

    return {
      success: true,
      status: 200,
      message: "Featured videos fetched successfully",
      videos,
    };
  } catch (error) {
    console.error("Get Featured Videos Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch featured videos",
    };
  }
};

// ========================================
// CREATE VIDEO - ADMIN
// ========================================

export const addVideo = async (data) => {
  try {
    const {
      title,
      description,
      youtubeId,
      youtubeUrl,
      thumbnail,
      category,
      status,
      isFeatured,
      publishedAt,
    } = data;

    // -------------------------
    // Required fields
    // -------------------------

    if (!title || !youtubeId || !youtubeUrl || !category) {
      return {
        success: false,
        status: 400,
        message: "Title, YouTube ID, YouTube URL and category are required",
      };
    }

    // -------------------------
    // Clean data
    // -------------------------

    const cleanTitle = title.trim();
    const cleanYoutubeId = youtubeId.trim();
    const cleanYoutubeUrl = youtubeUrl.trim();
    const cleanThumbnail = thumbnail ? thumbnail.trim() : "";

    // -------------------------
    // Title validation
    // -------------------------

    if (cleanTitle.length < 2) {
      return {
        success: false,
        status: 400,
        message: "Video title must be at least 2 characters",
      };
    }

    if (cleanTitle.length > 150) {
      return {
        success: false,
        status: 400,
        message: "Video title cannot exceed 150 characters",
      };
    }

    // -------------------------
    // Create video
    // -------------------------

    const video = await createVideo({
      title: cleanTitle,
      description: description ? description.trim() : "",
      youtubeId: cleanYoutubeId,
      youtubeUrl: cleanYoutubeUrl,
      thumbnail: cleanThumbnail,
      category,
      status: status || "published",
      isFeatured: Boolean(isFeatured),
      publishedAt: status === "draft" ? null : publishedAt || new Date(),
    });

    return {
      success: true,
      status: 201,
      message: "Video created successfully",
      video,
    };
  } catch (error) {
    console.error("Add Video Controller Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        status: 409,
        message: "This YouTube video already exists",
      };
    }

    return {
      success: false,
      status: 500,
      message: "Unable to create video",
    };
  }
};

// ========================================
// UPDATE VIDEO - ADMIN
// ========================================

export const editVideo = async (videoId, data) => {
  try {
    const updateData = {};

    if (data.title !== undefined) {
      const title = data.title.trim();

      if (title.length < 2) {
        return {
          success: false,
          status: 400,
          message: "Video title must be at least 2 characters",
        };
      }

      if (title.length > 150) {
        return {
          success: false,
          status: 400,
          message: "Video title cannot exceed 150 characters",
        };
      }

      updateData.title = title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    if (data.youtubeId !== undefined) {
      updateData.youtubeId = data.youtubeId.trim();
    }

    if (data.youtubeUrl !== undefined) {
      updateData.youtubeUrl = data.youtubeUrl.trim();
    }

    if (data.thumbnail !== undefined) {
      updateData.thumbnail = data.thumbnail.trim();
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === "published") {
        updateData.publishedAt = data.publishedAt || new Date();
      }

      if (data.status === "draft") {
        updateData.publishedAt = null;
      }
    }

    if (data.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(data.isFeatured);
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        status: 400,
        message: "No valid video data provided",
      };
    }

    const video = await updateVideo(videoId, updateData);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video updated successfully",
      video,
    };
  } catch (error) {
    console.error("Edit Video Controller Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        status: 409,
        message: "This YouTube video already exists",
      };
    }

    return {
      success: false,
      status: 500,
      message: "Unable to update video",
    };
  }
};

// ========================================
// DELETE VIDEO - ADMIN
// ========================================

export const removeVideo = async (videoId) => {
  try {
    const video = await deleteVideo(videoId);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video deleted successfully",
    };
  } catch (error) {
    console.error("Delete Video Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to delete video",
    };
  }
};

// ========================================
// INCREMENT VIDEO VIEWS
// ========================================

export const addVideoView = async (videoId) => {
  try {
    const video = await findVideoById(videoId);

    if (!video || video.status !== "published") {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    const updatedVideo = await incrementViews(videoId);

    return {
      success: true,
      status: 200,
      message: "View counted successfully",
      views: updatedVideo.views,
    };
  } catch (error) {
    console.error("Add Video View Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to count video view",
    };
  }
};

// ========================================
// SET FEATURED VIDEO - ADMIN
// ========================================

export const featureVideo = async (videoId) => {
  try {
    const video = await setFeaturedVideo(videoId);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video marked as featured",
      video,
    };
  } catch (error) {
    console.error("Feature Video Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to feature video",
    };
  }
};

// ========================================
// REMOVE FEATURED VIDEO - ADMIN
// ========================================

export const unfeatureVideo = async (videoId) => {
  try {
    const video = await removeFeaturedVideo(videoId);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video removed from featured",
      video,
    };
  } catch (error) {
    console.error("Unfeature Video Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to remove featured video",
    };
  }
};

// ========================================
// PUBLISH VIDEO - ADMIN
// ========================================

export const publish = async (videoId) => {
  try {
    const video = await publishVideo(videoId);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video published successfully",
      video,
    };
  } catch (error) {
    console.error("Publish Video Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to publish video",
    };
  }
};

// ========================================
// UNPUBLISH VIDEO - ADMIN
// ========================================

export const unpublish = async (videoId) => {
  try {
    const video = await unpublishVideo(videoId);

    if (!video) {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Video unpublished successfully",
      video,
    };
  } catch (error) {
    console.error("Unpublish Video Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to unpublish video",
    };
  }
};
