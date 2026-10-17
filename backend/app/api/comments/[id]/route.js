import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/config/db";
import Comment from "@/models/Comment";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

function response(data, status = 200) {
  return NextResponse.json(data, { status });
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
      success: false,
      status: authResult?.status || 401,
      message: authResult?.message || "Authentication required",
    };
  }

  const userId = authResult.user?.userId;

  if (!userId || !isValidObjectId(String(userId))) {
    return {
      success: false,
      status: 401,
      message: "Invalid authentication token",
    };
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "User not found",
    };
  }

  if (user.isBlocked) {
    return {
      success: false,
      status: 403,
      message: "Your account has been blocked",
    };
  }

  return {
    success: true,
    user,
  };
}

async function getComment(id) {
  if (!isValidObjectId(id)) {
    return { error: "Invalid comment ID", status: 400 };
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    return { error: "Comment not found", status: 404 };
  }

  return { comment };
}

function isCommentOwner(comment, user) {
  return (
    Boolean(comment.user) && comment.user.toString() === user._id.toString()
  );
}

// GET /api/comments/:id
// Public: visible comments only.
// Admin: can view hidden comments too.

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const result = await getComment(id);

    if (result.error) {
      return response({ success: false, message: result.error }, result.status);
    }

    const { comment } = result;

    if (comment.status !== "visible") {
      const auth = await getAuthenticatedUser(request);

      if (!auth.success) {
        return response({ success: false, message: "Comment not found" }, 404);
      }

      if (auth.user.role !== "admin") {
        return response({ success: false, message: "Comment not found" }, 404);
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name username avatar")
      .populate("video", "title youtubeId thumbnail");

    return response({
      success: true,
      message: "Comment fetched successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Get Comment API Error:", error);

    return response(
      { success: false, message: "Unable to fetch comment" },
      500,
    );
  }
}

// PUT /api/comments/:id
// Registered users can edit their own comments within 48 hours.

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const result = await getComment(id);

    if (result.error) {
      return response({ success: false, message: result.error }, result.status);
    }

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return response({ success: false, message: auth.message }, auth.status);
    }

    const { comment } = result;

    if (!isCommentOwner(comment, auth.user)) {
      return response(
        {
          success: false,
          message: "You can only edit your own comments",
        },
        403,
      );
    }

    if (comment.status === "deleted") {
      return response(
        {
          success: false,
          message: "Deleted comments cannot be edited",
        },
        400,
      );
    }

    const body = await request.json();

    if (typeof body.text !== "string") {
      return response(
        { success: false, message: "Comment text is required" },
        400,
      );
    }

    const cleanText = body.text.trim();

    if (!cleanText) {
      return response(
        { success: false, message: "Comment cannot be empty" },
        400,
      );
    }

    if (cleanText.length > 1000) {
      return response(
        {
          success: false,
          message: "Comment cannot exceed 1000 characters",
        },
        400,
      );
    }

    const fortyEightHours = 48 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(comment.createdAt).getTime();

    if (elapsed >= fortyEightHours) {
      return response(
        {
          success: false,
          message: "Comment can only be edited within 48 hours",
        },
        403,
      );
    }

    comment.text = cleanText;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "name username avatar")
      .populate("video", "title youtubeId thumbnail");

    return response({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update Comment API Error:", error);

    return response(
      { success: false, message: "Unable to update comment" },
      500,
    );
  }
}

// PATCH /api/comments/:id
// Admin can hide or restore a comment.

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return response({ success: false, message: auth.message }, auth.status);
    }

    if (auth.user.role !== "admin") {
      return response(
        { success: false, message: "Admin access required" },
        403,
      );
    }

    const { id } = await params;
    const result = await getComment(id);

    if (result.error) {
      return response({ success: false, message: result.error }, result.status);
    }

    const { comment } = result;
    const body = await request.json();

    if (body.status !== "visible" && body.status !== "hidden") {
      return response(
        {
          success: false,
          message: "Status must be either visible or hidden",
        },
        400,
      );
    }

    if (comment.status === "deleted") {
      return response(
        {
          success: false,
          message: "Deleted comments cannot be restored",
        },
        400,
      );
    }

    comment.status = body.status;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "name username avatar")
      .populate("video", "title youtubeId thumbnail");

    return response({
      success: true,
      message:
        body.status === "hidden"
          ? "Comment hidden successfully"
          : "Comment restored successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update Comment Status API Error:", error);

    return response(
      {
        success: false,
        message: "Unable to update comment status",
      },
      500,
    );
  }
}

// DELETE /api/comments/:id
// Owner can delete their own comment; admin can delete any comment.

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return response({ success: false, message: auth.message }, auth.status);
    }

    const { id } = await params;
    const result = await getComment(id);

    if (result.error) {
      return response({ success: false, message: result.error }, result.status);
    }

    const { comment } = result;
    const isOwner = isCommentOwner(comment, auth.user);
    const isAdmin = auth.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return response(
        {
          success: false,
          message: "You are not allowed to delete this comment",
        },
        403,
      );
    }

    await Comment.findByIdAndDelete(comment._id);

    return response({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Comment API Error:", error);

    return response(
      { success: false, message: "Unable to delete comment" },
      500,
    );
  }
}
