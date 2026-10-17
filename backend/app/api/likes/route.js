import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/config/db";
import Like from "@/models/Like";
import Video from "@/models/Video";
import authMiddleware from "@/middleware/authMiddleware";

// ========================================
// STANDARD API RESPONSE
// ========================================

function sendResponse(success, message, status = 200, extra = {}) {
  return NextResponse.json(
    {
      success,
      message,
      ...extra,
    },
    { status },
  );
}

// AUTHENTICATION

async function getAuthenticatedUser(request) {
  try {
    const auth = await authMiddleware(request);

    if (!auth?.success || !auth?.user) {
      return {
        error: sendResponse(
          false,
          auth?.message || "Please log in to continue.",
          auth?.status || 401,
        ),
      };
    }

    const userId = auth.user.userId || auth.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return {
        error: sendResponse(
          false,
          "Your session could not be verified. Please log in again.",
          401,
        ),
      };
    }

    if (auth.user.role === "admin") {
      return {
        error: sendResponse(
          false,
          "This feature is available to regular users only.",
          403,
        ),
      };
    }

    return { userId };
  } catch (error) {
    console.error("Like authentication error:", error);

    return {
      error: sendResponse(
        false,
        "Authentication failed. Please log in again.",
        401,
      ),
    };
  }
}

// ========================================
// VALIDATE VIDEO ID
// ========================================

function isValidVideoId(videoId) {
  return (
    typeof videoId === "string" && mongoose.Types.ObjectId.isValid(videoId)
  );
}

// ========================================
// GET /api/likes
// GET ALL LIKED VIDEOS FOR CURRENT USER
// ========================================

export async function GET(request) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (auth.error) {
      return auth.error;
    }

    const likes = await Like.find({
      user: auth.userId,
    })
      .populate({
        path: "video",
        match: { status: "published" },
        populate: {
          path: "category",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const likedVideos = likes
      .filter((like) => like.video)
      .map((like) => ({
        ...like.video,
        likedAt: like.createdAt,
      }));

    return sendResponse(true, "Liked videos retrieved successfully.", 200, {
      count: likedVideos.length,
      likedVideos,
    });
  } catch (error) {
    console.error("GET /api/likes error:", error);

    return sendResponse(
      false,
      "Unable to load liked videos. Please try again later.",
      500,
    );
  }
}

// ========================================
// POST /api/likes
// LIKE A VIDEO
// ========================================

export async function POST(request) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (auth.error) {
      return auth.error;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return sendResponse(
        false,
        "Invalid request data. Please try again.",
        400,
      );
    }

    const { videoId } = body || {};

    if (!isValidVideoId(videoId)) {
      return sendResponse(false, "Please provide a valid video ID.", 400);
    }

    const video = await Video.findOne({
      _id: videoId,
      status: "published",
    }).select("_id");

    if (!video) {
      return sendResponse(
        false,
        "The requested video was not found or is not published.",
        404,
      );
    }

    const existingLike = await Like.findOne({
      user: auth.userId,
      video: videoId,
    });

    if (existingLike) {
      return sendResponse(true, "You have already liked this video.", 200, {
        liked: true,
      });
    }

    await Like.create({
      user: auth.userId,
      video: videoId,
    });

    return sendResponse(true, "Video liked successfully.", 201, {
      liked: true,
    });
  } catch (error) {
    console.error("POST /api/likes error:", error);

    if (error.code === 11000) {
      return sendResponse(true, "You have already liked this video.", 200, {
        liked: true,
      });
    }

    return sendResponse(
      false,
      "Unable to like this video. Please try again later.",
      500,
    );
  }
}

// ========================================
// DELETE /api/likes
// REMOVE A LIKE
// ========================================

export async function DELETE(request) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (auth.error) {
      return auth.error;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return sendResponse(
        false,
        "Invalid request data. Please try again.",
        400,
      );
    }

    const { videoId } = body || {};

    if (!isValidVideoId(videoId)) {
      return sendResponse(false, "Please provide a valid video ID.", 400);
    }

    const result = await Like.deleteOne({
      user: auth.userId,
      video: videoId,
    });

    if (result.deletedCount === 0) {
      return sendResponse(
        true,
        "This video is not in your liked videos.",
        200,
        { liked: false },
      );
    }

    return sendResponse(true, "Video unliked successfully.", 200, {
      liked: false,
    });
  } catch (error) {
    console.error("DELETE /api/likes error:", error);

    return sendResponse(
      false,
      "Unable to remove the like. Please try again later.",
      500,
    );
  }
}
