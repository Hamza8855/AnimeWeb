import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Verify that the current user is an admin in MongoDB.
async function getAdmin(request) {
  const authResult = await authMiddleware(request);

  if (!authResult.success) {
    return {
      error: jsonResponse(
        {
          success: false,
          message: authResult.message || "Authentication required",
        },
        authResult.status || 401,
      ),
    };
  }

  const userId = authResult.user?.userId;

  if (!userId) {
    return {
      error: jsonResponse(
        { success: false, message: "Invalid authentication token" },
        401,
      ),
    };
  }

  const admin = await User.findById(userId).select("-password");

  if (!admin) {
    return {
      error: jsonResponse({ success: false, message: "User not found" }, 404),
    };
  }

  if (admin.role !== "admin") {
    return {
      error: jsonResponse(
        { success: false, message: "Admin access required" },
        403,
      ),
    };
  }

  return { admin };
}

// GET /api/users
// Admin-only user list with optional search.
export async function GET(request) {
  try {
    await connectDB();

    const result = await getAdmin(request);

    if (result.error) return result.error;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({
      success: true,
      message: "Users fetched successfully",
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Get Users API Error:", error);

    return jsonResponse(
      { success: false, message: "Unable to fetch users" },
      500,
    );
  }
}

// PATCH /api/users
// Actions: verify, unverify, block, unblock.
export async function PATCH(request) {
  try {
    await connectDB();

    const result = await getAdmin(request);

    if (result.error) return result.error;

    let data;

    try {
      data = await request.json();
    } catch {
      return jsonResponse(
        { success: false, message: "Invalid request body" },
        400,
      );
    }

    const { userId, action } = data;

    if (!userId || !action) {
      return jsonResponse(
        { success: false, message: "userId and action are required" },
        400,
      );
    }

    const allowedActions = {
      verify: { isVerified: true },
      unverify: { isVerified: false },
      block: { isBlocked: true },
      unblock: { isBlocked: false },
    };

    const update = allowedActions[action];

    if (!update) {
      return jsonResponse(
        { success: false, message: "Invalid user action" },
        400,
      );
    }

    if (String(result.admin._id) === String(userId)) {
      return jsonResponse(
        { success: false, message: "You cannot change your own admin account" },
        403,
      );
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return jsonResponse({ success: false, message: "User not found" }, 404);
    }

    if (targetUser.role === "admin") {
      return jsonResponse(
        { success: false, message: "You cannot manage another admin here" },
        403,
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true },
    )
      .select("-password")
      .lean();

    return jsonResponse({
      success: true,
      message: `User ${action} successful`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User API Error:", error);

    return jsonResponse(
      { success: false, message: "Unable to update user" },
      500,
    );
  }
}

// DELETE /api/users
// Body: { "userId": "..." }
export async function DELETE(request) {
  try {
    await connectDB();

    const result = await getAdmin(request);

    if (result.error) return result.error;

    let data;

    try {
      data = await request.json();
    } catch {
      return jsonResponse(
        { success: false, message: "Invalid request body" },
        400,
      );
    }

    const { userId } = data;

    if (!userId) {
      return jsonResponse(
        { success: false, message: "userId is required" },
        400,
      );
    }

    if (String(result.admin._id) === String(userId)) {
      return jsonResponse(
        { success: false, message: "You cannot delete your own admin account" },
        403,
      );
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return jsonResponse({ success: false, message: "User not found" }, 404);
    }

    if (targetUser.role === "admin") {
      return jsonResponse(
        { success: false, message: "You cannot delete another admin here" },
        403,
      );
    }

    await User.findByIdAndDelete(userId);

    return jsonResponse({
      success: true,
      message: "User deleted successfully",
      userId,
    });
  } catch (error) {
    console.error("Delete User API Error:", error);

    return jsonResponse(
      { success: false, message: "Unable to delete user" },
      500,
    );
  }
}
