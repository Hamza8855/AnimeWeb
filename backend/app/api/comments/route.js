import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import connectDB from "@/config/db";
import Comment from "@/models/Comment";
import Video from "@/models/Video";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

function apiResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function hashGuestToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function isValidObjectId(id) {
  return (
    typeof id === "string" &&
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
}

async function getAuthenticatedUser(request) {
  const authResult = await authMiddleware(request);

  if (!authResult?.success) {
    return {
      authenticated: false,
      user: null,
      error: authResult,
    };
  }

  const userId = authResult.user?.userId;

  if (!userId || !isValidObjectId(String(userId))) {
    return {
      authenticated: false,
      user: null,
      error: {
        success: false,
        status: 401,
        message: "Invalid authentication token",
      },
    };
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return {
      authenticated: false,
      user: null,
      error: {
        success: false,
        status: 401,
        message: "User not found",
      },
    };
  }

  if (user.isBlocked) {
    return {
      authenticated: false,
      user: null,
      error: {
        success: false,
        status: 403,
        message: "Your account has been blocked",
      },
    };
  }

  return {
    authenticated: true,
    user,
    error: null,
  };
}

// GET /api/comments?videoId=VIDEO_ID
// GET /api/comments?admin=true

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const adminRequest = searchParams.get("admin") === "true";

    // Admin: fetch all comments, including hidden comments.
    if (adminRequest) {
      const auth = await getAuthenticatedUser(request);

      if (!auth.authenticated) {
        return apiResponse(
          {
            success: false,
            message: auth.error?.message || "Authentication required",
          },
          auth.error?.status || 401,
        );
      }

      if (auth.user.role !== "admin") {
        return apiResponse(
          {
            success: false,
            message: "Admin access required",
          },
          403,
        );
      }

      const comments = await Comment.find()
        .select("+guestId +guestClaimTokenHash")
        .populate("user", "name username email avatar")
        .populate("video", "title youtubeId thumbnail status")
        .sort({ createdAt: -1 });

      // Never expose guest verification secrets to the admin UI.
      const safeComments = comments.map((comment) => {
        const item = comment.toObject();
        delete item.guestId;
        delete item.guestClaimTokenHash;
        return item;
      });

      return apiResponse({
        success: true,
        message: "All comments fetched successfully",
        comments: safeComments,
        count: safeComments.length,
      });
    }

    // Public requests must specify a valid video.
    if (!videoId || !isValidObjectId(videoId)) {
      return apiResponse(
        {
          success: false,
          message: "A valid videoId is required",
        },
        400,
      );
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return apiResponse(
        {
          success: false,
          message: "Video not found",
        },
        404,
      );
    }

    // Only visible comments are public.
    const comments = await Comment.find({
      video: videoId,
      status: "visible",
    })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    return apiResponse({
      success: true,
      message: "Comments fetched successfully",
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("Get Comments API Error:", error);

    return apiResponse(
      {
        success: false,
        message: "Unable to fetch comments",
      },
      500,
    );
  }
}

// POST /api/comments
// Body: { "videoId": "...", "text": "Amazing video!" }

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { videoId, text } = body;

    if (!videoId || !isValidObjectId(videoId)) {
      return apiResponse(
        {
          success: false,
          message: "A valid videoId is required",
        },
        400,
      );
    }

    if (typeof text !== "string") {
      return apiResponse(
        {
          success: false,
          message: "Comment text is required",
        },
        400,
      );
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return apiResponse(
        {
          success: false,
          message: "Comment cannot be empty",
        },
        400,
      );
    }

    if (cleanText.length > 1000) {
      return apiResponse(
        {
          success: false,
          message: "Comment cannot exceed 1000 characters",
        },
        400,
      );
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return apiResponse(
        {
          success: false,
          message: "Video not found",
        },
        404,
      );
    }

    // Determine whether this is a registered user or a guest.
    const auth = await getAuthenticatedUser(request);

    let currentUser = null;

    if (auth.authenticated) {
      currentUser = auth.user;
    } else {
      // If credentials were explicitly supplied but rejected,
      // do not silently create a guest comment instead.
      const authorization = request.headers.get("authorization");
      const cookieToken = request.cookies?.get?.("token")?.value;

      if (authorization || cookieToken) {
        return apiResponse(
          {
            success: false,
            message: auth.error?.message || "Authentication failed",
          },
          auth.error?.status || 401,
        );
      }
    }

    // Only admins can comment on unpublished videos.
    if (video.status !== "published") {
      if (!currentUser || currentUser.role !== "admin") {
        return apiResponse(
          {
            success: false,
            message: "Comments are not available for this video",
          },
          403,
        );
      }
    }

    // Create a registered-user comment or a guest comment.
    const commentData = {
      user: currentUser ? currentUser._id : null,
      authorName: currentUser
        ? currentUser.username || currentUser.name || "User"
        : "Guest",
      video: video._id,
      text: cleanText,
      status: "visible",
    };

    let guestClaimToken;

    if (!currentUser) {
      // Keep only the token hash in MongoDB.
      // The original token is returned once to the guest.
      guestClaimToken = randomBytes(32).toString("hex");

      commentData.guestId = randomUUID();
      commentData.guestClaimTokenHash = hashGuestToken(guestClaimToken);
    }

    const comment = await Comment.create(commentData);

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name username avatar")
      .populate("video", "title youtubeId thumbnail");

    return apiResponse(
      {
        success: true,
        message: "Comment added successfully",
        comment: populatedComment,
        ...(guestClaimToken ? { guestClaimToken } : {}),
      },
      201,
    );
  } catch (error) {
    console.error("Create Comment API Error:", error);

    return apiResponse(
      {
        success: false,
        message: "Unable to create comment",
      },
      500,
    );
  }
}
