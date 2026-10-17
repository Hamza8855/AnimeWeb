import {
  getVideoComments,
  getAllComments,
  findCommentById,
  createComment,
  updateComment,
  deleteOwnComment,
  hideComment,
  showComment,
  deleteComment,
} from "@/services/comment.service";

import Video from "@/models/Video";

// GET COMMENTS OF A VIDEO

export const getComments = async (videoId) => {
  try {
    // Check whether video exists
    const video = await Video.findById(videoId);

    if (!video || video.status !== "published") {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    const comments = await getVideoComments(videoId);

    return {
      success: true,
      status: 200,
      message: "Comments fetched successfully",
      comments,
    };
  } catch (error) {
    console.error("Get Comments Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch comments",
    };
  }
};

// ========================================
// GET ALL COMMENTS - ADMIN
// ========================================

export const getAdminComments = async () => {
  try {
    const comments = await getAllComments();

    return {
      success: true,
      status: 200,
      message: "Admin comments fetched successfully",
      comments,
    };
  } catch (error) {
    console.error("Get Admin Comments Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch comments",
    };
  }
};

// ========================================
// GET SINGLE COMMENT
// ========================================

export const getComment = async (commentId) => {
  try {
    const comment = await findCommentById(commentId);

    if (!comment) {
      return {
        success: false,
        status: 404,
        message: "Comment not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Comment fetched successfully",
      comment,
    };
  } catch (error) {
    console.error("Get Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch comment",
    };
  }
};

// CREATE COMMENT - USER
// ========================================

export const addComment = async (userId, videoId, data) => {
  try {
    const { text } = data;

    // Check comment text
    if (!text) {
      return {
        success: false,
        status: 400,
        message: "Comment text is required",
      };
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return {
        success: false,
        status: 400,
        message: "Comment cannot be empty",
      };
    }

    if (cleanText.length > 1000) {
      return {
        success: false,
        status: 400,
        message: "Comment cannot exceed 1000 characters",
      };
    }

    // Check whether video exists
    const video = await Video.findById(videoId);

    if (!video || video.status !== "published") {
      return {
        success: false,
        status: 404,
        message: "Video not found",
      };
    }

    // Create comment
    const comment = await createComment({
      user: userId,
      video: videoId,
      text: cleanText,
      status: "visible",
    });

    // Get populated comment
    const populatedComment = await findCommentById(comment._id);

    return {
      success: true,
      status: 201,
      message: "Comment added successfully",
      comment: populatedComment,
    };
  } catch (error) {
    console.error("Add Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to add comment",
    };
  }
};

// ========================================
// UPDATE OWN COMMENT - USER
// ========================================

export const editOwnComment = async (commentId, userId, data) => {
  try {
    const { text } = data;

    if (!text) {
      return {
        success: false,
        status: 400,
        message: "Comment text is required",
      };
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return {
        success: false,
        status: 400,
        message: "Comment cannot be empty",
      };
    }

    if (cleanText.length > 1000) {
      return {
        success: false,
        status: 400,
        message: "Comment cannot exceed 1000 characters",
      };
    }

    // Service checks comment ownership
    const comment = await updateComment(commentId, userId, cleanText);

    if (!comment) {
      return {
        success: false,
        status: 404,
        message: "Comment not found or you are not allowed to edit it",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Comment updated successfully",
      comment,
    };
  } catch (error) {
    console.error("Edit Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to update comment",
    };
  }
};

// ========================================
// DELETE OWN COMMENT - USER
// ========================================

export const removeOwnComment = async (commentId, userId) => {
  try {
    const comment = await deleteOwnComment(commentId, userId);

    if (!comment) {
      return {
        success: false,
        status: 404,
        message: "Comment not found or you are not allowed to delete it",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Comment deleted successfully",
    };
  } catch (error) {
    console.error("Delete Own Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to delete comment",
    };
  }
};

// ========================================
// HIDE COMMENT - ADMIN
// ========================================

export const hide = async (commentId) => {
  try {
    const comment = await hideComment(commentId);

    if (!comment) {
      return {
        success: false,
        status: 404,
        message: "Comment not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Comment hidden successfully",
      comment,
    };
  } catch (error) {
    console.error("Hide Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to hide comment",
    };
  }
};

// ========================================
// SHOW COMMENT - ADMIN
// ========================================

export const show = async (commentId) => {
  try {
    const comment = await showComment(commentId);

    if (!comment) {
      return {
        success: false,
        status: 404,
        message: "Comment not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Comment shown successfully",
      comment,
    };
  } catch (error) {
    console.error("Show Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to show comment",
    };
  }
};

// ========================================
// DELETE COMMENT - ADMIN
// ========================================

export const removeComment = async (commentId) => {
  try {
    const comment = await deleteComment(commentId);

    if (!comment) {
      return {
        success: false,
        status: 404,
        message: "Comment not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Comment deleted successfully",
    };
  } catch (error) {
    console.error("Admin Delete Comment Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to delete comment",
    };
  }
};
