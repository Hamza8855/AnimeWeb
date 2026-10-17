import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/config/db";
import User from "@/models/User";
import Video from "@/models/Video";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import Contact from "@/models/Contact";

import authMiddleware from "@/middleware/authMiddleware";
import adminMiddleware from "@/middleware/admin.middleware";

const respond = (success, message, status, extra = {}) =>
  NextResponse.json({ success, message, ...extra }, { status });

export async function GET(request) {
  try {
    // 1. Verify authentication token.
    const auth = authMiddleware(request);

    if (!auth?.success) {
      return respond(
        false,
        auth?.message || "Authentication required",
        auth?.status || 401,
      );
    }

    // 2. Validate user ID from the verified token.
    const userId = auth.user?.userId;

    if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
      return respond(false, "Invalid authentication token", 401);
    }

    // 3. Connect to MongoDB.
    await connectDB();

    // 4. Fetch the current user's actual database permissions.
    const currentUser = await User.findById(userId)
      .select("role isBlocked")
      .lean();

    if (!currentUser) {
      return respond(false, "User not found", 401);
    }

    if (currentUser.isBlocked) {
      return respond(false, "Your account is blocked", 403);
    }

    // 5. Verify admin permission using the database user.
    const admin = adminMiddleware(request, currentUser);

    if (!admin?.success) {
      return respond(
        false,
        admin?.message || "Admin access required",
        admin?.status || 403,
      );
    }

    // 6. Fetch dashboard statistics and recent records.
    const [
      totalVideos,
      totalUsers,
      totalComments,
      totalLikes,
      totalMessages,
      recentVideos,
      recentUsers,
      recentComments,
      recentMessages,
    ] = await Promise.all([
      Video.countDocuments(),

      User.countDocuments(),

      Comment.countDocuments({
        status: { $in: ["visible", "hidden"] },
      }),

      Like.countDocuments(),

      Contact.countDocuments(),

      Video.find()
        .sort({ createdAt: -1, _id: -1 })
        .limit(4)
        .select("title thumbnail views likes status createdAt")
        .populate("category", "name")
        .lean(),

      User.find()
        .sort({ createdAt: -1, _id: -1 })
        .limit(4)
        .select("name username email role createdAt")
        .lean(),

      Comment.find({
        status: { $in: ["visible", "hidden"] },
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(4)
        .select("user video text status createdAt")
        .populate("user", "name username")
        .populate("video", "title")
        .lean(),

      Contact.find()
        .sort({ createdAt: -1, _id: -1 })
        .limit(4)
        .select("name email subject message status createdAt")
        .lean(),
    ]);

    // 7. Return dashboard data.
    return NextResponse.json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        stats: {
          totalVideos,
          totalUsers,
          totalComments,
          totalLikes,
          totalMessages,
        },
        recentVideos,
        recentUsers,
        recentComments: recentComments.map((comment) => ({
          ...comment,
          createdAt: comment.createdAt ?? comment._id.getTimestamp(),
        })),
        recentMessages,
      },
    });
  } catch (error) {
    console.error("Admin Dashboard API Error:", error.message);

    return respond(false, "Failed to fetch dashboard data", 500);
  }
}
