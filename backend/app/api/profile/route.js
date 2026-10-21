import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

// ======================================================
// CORS HEADERS
// ======================================================

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://anime-web-c.vercel.app",
];

function getCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }

  headers.set(
    "Access-Control-Allow-Methods",
    "GET, PUT, PATCH, DELETE, OPTIONS",
  );
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return headers;
}

// ======================================================
// OPTIONS /api/profile
// ======================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// ======================================================
// GET /api/profile
// GET CURRENT USER PROFILE
// ======================================================

export async function GET(request) {
  try {
    await connectDB();

    const authResult = authMiddleware(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        {
          status: authResult.status,
          headers: corsHeaders,
        },
      );
    }

    const userId = authResult.user.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authentication token",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile fetched successfully",
        user,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Get Profile API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch profile",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// ======================================================
// PUT /api/profile
// UPDATE PROFILE
// Allowed: name, username, email, avatar, bio
// Restricted: password, role, verification and block status
// ======================================================

export async function PUT(request) {
  try {
    await connectDB();

    const authResult = authMiddleware(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        {
          status: authResult.status,
          headers: corsHeaders,
        },
      );
    }

    const userId = authResult.user.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authentication token",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const data = await request.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid profile data",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const restrictedFields = ["password", "role", "isVerified", "isBlocked"];

    if (
      restrictedFields.some((field) =>
        Object.prototype.hasOwnProperty.call(data, field),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot change account permissions or password through this API",
        },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    const updateData = {};

    // UPDATE NAME

    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be a string",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const name = data.name.trim();

      if (name.length < 2 || name.length > 50) {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be between 2 and 50 characters",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      updateData.name = name;
    }

    // UPDATE USERNAME

    if (data.username !== undefined) {
      if (typeof data.username !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Username must be a string",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const username = data.username.trim().toLowerCase();

      if (
        username.length < 3 ||
        username.length > 30 ||
        !/^[a-zA-Z0-9_]+$/.test(username)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Username must be 3-30 characters and contain only letters, numbers or underscores",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const existingUsername = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUsername) {
        return NextResponse.json(
          {
            success: false,
            message: "This username is already taken",
          },
          {
            status: 409,
            headers: corsHeaders,
          },
        );
      }

      updateData.username = username;
    }

    // UPDATE EMAIL

    if (data.email !== undefined) {
      if (typeof data.email !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Email must be a string",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const email = data.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid email address",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const existingEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "This email is already registered",
          },
          {
            status: 409,
            headers: corsHeaders,
          },
        );
      }

      updateData.email = email;
    }

    // UPDATE AVATAR

    if (data.avatar !== undefined) {
      if (typeof data.avatar !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Avatar must be a string",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      updateData.avatar = data.avatar.trim();
    }

    // UPDATE BIO

    if (data.bio !== undefined) {
      if (typeof data.bio !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Bio must be a string",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const bio = data.bio.trim();

      if (bio.length > 300) {
        return NextResponse.json(
          {
            success: false,
            message: "Bio cannot exceed 300 characters",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      updateData.bio = bio;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid profile data provided",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Update Profile API Error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Username or email is already in use",
        },
        {
          status: 409,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update profile",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// ======================================================
// PATCH /api/profile
// CHANGE PASSWORD
// ======================================================

export async function PATCH(request) {
  try {
    await connectDB();

    const authResult = authMiddleware(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        {
          status: authResult.status,
          headers: corsHeaders,
        },
      );
    }

    const userId = authResult.user.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authentication token",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const data = await request.json();

    const { currentPassword, newPassword, confirmPassword } = data;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password, new password and confirm password are required",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New passwords do not match",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatched) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const passwordIsSame = await bcrypt.compare(newPassword, user.password);

    if (passwordIsSame) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from the current password",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Change Password API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to change password",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// ======================================================
// DELETE /api/profile
// ACCOUNT DELETION DISABLED
// ======================================================

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Account deletion is disabled. Your account and data are protected.",
    },
    {
      status: 403,
      headers: corsHeaders,
    },
  );
}
