import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/config/db";
import SavedVideo from "@/models/SavedVideo";
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

// ========================================
// AUTHENTICATE USER
// ========================================

async function getAuthenticatedUser(request) {
  try {
    const authResult = await authMiddleware(request);

    if (!authResult?.success || !authResult?.user) {
      return {
        error: sendResponse(
          false,
          authResult?.message || "Please log in to continue.",
          authResult?.status || 401,
        ),
      };
    }

    const userId = authResult.user.userId || authResult.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return {
        error: sendResponse(
          false,
          "Your session could not be verified. Please log in again.",
          401,
        ),
      };
    }

    if (authResult.user.role === "admin") {
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
    console.error("Saved videos authentication error:", error);

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
// GET /api/saved-videos
// RETRIEVE SAVED VIDEOS FOR CURRENT USER
// ========================================

export async function GET(request) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (auth.error) {
      return auth.error;
    }

    const savedVideos = await SavedVideo.find({
      user: auth.userId,
    })
      .populate({
        path: "video",
        match: { status: "published" },
        populate: {
          path: "category",
          select: "name slug description image",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const filteredSavedVideos = savedVideos.filter((item) => item.video);

    return sendResponse(true, "Saved videos retrieved successfully.", 200, {
      count: filteredSavedVideos.length,
      savedVideos: filteredSavedVideos,
    });
  } catch (error) {
    console.error("GET /api/saved-videos error:", error);

    return sendResponse(
      false,
      "Unable to load saved videos. Please try again later.",
      500,
    );
  }
}

// ========================================
// POST /api/saved-videos
// SAVE A VIDEO
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

    const existingSave = await SavedVideo.findOne({
      user: auth.userId,
      video: video._id,
    });

    if (existingSave) {
      return sendResponse(
        true,
        "This video is already in your saved videos.",
        200,
        {
          saved: true,
          savedVideo: existingSave,
        },
      );
    }

    const savedVideo = await SavedVideo.create({
      user: auth.userId,
      video: video._id,
    });

    return sendResponse(true, "Video saved successfully.", 201, {
      saved: true,
      savedVideo,
    });
  } catch (error) {
    console.error("POST /api/saved-videos error:", error);

    if (error.code === 11000) {
      return sendResponse(
        true,
        "This video is already in your saved videos.",
        200,
        { saved: true },
      );
    }

    return sendResponse(
      false,
      "Unable to save this video. Please try again later.",
      500,
    );
  }
}

// ========================================
// DELETE /api/saved-videos
// REMOVE A SAVED VIDEO
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

    const result = await SavedVideo.deleteOne({
      user: auth.userId,
      video: videoId,
    });

    if (result.deletedCount === 0) {
      return sendResponse(
        true,
        "This video is not in your saved videos.",
        200,
        { saved: false },
      );
    }

    return sendResponse(true, "Video removed from your saved videos.", 200, {
      saved: false,
    });
  } catch (error) {
    console.error("DELETE /api/saved-videos error:", error);

    return sendResponse(
      false,
      "Unable to remove this saved video. Please try again later.",
      500,
    );
  }
}
