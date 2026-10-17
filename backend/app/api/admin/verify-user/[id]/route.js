import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

// HELPER
// Authenticate admin

const getAdminUser = async (request) => {
  // Step 1: Check JWT / Cookie

  const authResult = authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      status: authResult.status,
      message: authResult.message,
    };
  }

  // Step 2: Get userId from JWT

  const userId = authResult.user.userId;

  if (!userId) {
    return {
      success: false,
      status: 401,
      message: "Invalid authentication token",
    };
  }

  // ----------------------------------------------------
  // Step 3: Get actual user from database
  // ----------------------------------------------------

  const admin = await User.findById(userId).select("-password");

  if (!admin) {
    return {
      success: false,
      status: 404,
      message: "Admin user not found",
    };
  }

  // ----------------------------------------------------
  // Step 4: Check blocked status
  // ----------------------------------------------------

  if (admin.isBlocked) {
    return {
      success: false,
      status: 403,
      message: "Your account has been blocked",
    };
  }

  // Step 5: Check admin role

  if (admin.role !== "admin") {
    return {
      success: false,
      status: 403,
      message: "Admin access required",
    };
  }

  return {
    success: true,
    admin,
  };
};

// PATCH /api/admin/verify-user/:id
//
// Admin kisi user ko verify karega.
//
// Example:
//
// PATCH /api/admin/verify-user/USER_ID

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    // ADMIN AUTHENTICATION

    const adminAuth = await getAdminUser(request);

    if (!adminAuth.success) {
      return NextResponse.json(
        {
          success: false,
          message: adminAuth.message,
        },
        {
          status: adminAuth.status,
        },
      );
    }

    // GET USER ID

    const { id } = await params;

    // FIND USER

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // CHECK CURRENT VERIFICATION STATUS

    if (user.isVerified) {
      return NextResponse.json(
        {
          success: true,
          message: "User is already verified",
          user: {
            id: user._id,
            name: user.name,
            username: user.username || "",
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isBlocked: user.isBlocked,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt,
          },
        },
        {
          status: 200,
        },
      );
    }

    // ==================================================
    // VERIFY USER
    // ==================================================

    user.isVerified = true;

    await user.save();

    // SAFE USER RESPONSE

    const safeUser = {
      id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    // RESPONSE

    return NextResponse.json(
      {
        success: true,
        message: "User verified successfully",
        user: safeUser,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Verify User API Error:", error);

    // Invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify user",
      },
      {
        status: 500,
      },
    );
  }
}
