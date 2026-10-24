import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

const ALLOWED_ORIGINS = ["https://anime-web-c.vercel.app"];
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

function jsonResponse(request, data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(request),
  });
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request) {
  try {
    await connectDB();

    const authResult = authMiddleware(request);

    if (!authResult.success) {
      return jsonResponse(
        request,
        { success: false, message: authResult.message },
        authResult.status,
      );
    }

    const userId = authResult.user?.userId;

    if (!userId) {
      return jsonResponse(
        request,
        { success: false, message: "Invalid authentication token" },
        401,
      );
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return jsonResponse(
        request,
        { success: false, message: "User not found" },
        404,
      );
    }

    return jsonResponse(request, {
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get Profile API Error:", error);

    return jsonResponse(
      request,
      { success: false, message: "Unable to fetch profile" },
      500,
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const authResult = authMiddleware(request);

    if (!authResult.success) {
      return jsonResponse(
        request,
        { success: false, message: authResult.message },
        authResult.status,
      );
    }

    const userId = authResult.user?.userId;

    if (!userId) {
      return jsonResponse(
        request,
        { success: false, message: "Invalid authentication token" },
        401,
      );
    }

    let data;

    try {
      data = await request.json();
    } catch {
      return jsonResponse(
        request,
        { success: false, message: "Invalid request data" },
        400,
      );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return jsonResponse(
        request,
        { success: false, message: "Invalid profile data" },
        400,
      );
    }

    const restrictedFields = ["password", "role", "isVerified", "isBlocked"];

    if (
      restrictedFields.some((field) =>
        Object.prototype.hasOwnProperty.call(data, field),
      )
    ) {
      return jsonResponse(
        request,
        {
          success: false,
          message:
            "You cannot change account permissions or password through this API",
        },
        403,
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return jsonResponse(
        request,
        { success: false, message: "User not found" },
        404,
      );
    }

    const updateData = {};

    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
        return jsonResponse(
          request,
          { success: false, message: "Name must be a string" },
          400,
        );
      }

      const name = data.name.trim();

      if (name.length < 2 || name.length > 50) {
        return jsonResponse(
          request,
          {
            success: false,
            message: "Name must be between 2 and 50 characters",
          },
          400,
        );
      }

      updateData.name = name;
    }

    if (data.username !== undefined) {
      if (typeof data.username !== "string") {
        return jsonResponse(
          request,
          { success: false, message: "Username must be a string" },
          400,
        );
      }

      const username = data.username.trim().toLowerCase();

      if (
        username.length < 3 ||
        username.length > 30 ||
        !/^[a-z0-9_]+$/.test(username)
      ) {
        return jsonResponse(
          request,
          {
            success: false,
            message:
              "Username must be 3-30 characters and contain only letters, numbers or underscores",
          },
          400,
        );
      }

      const existingUsername = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUsername) {
        return jsonResponse(
          request,
          { success: false, message: "This username is already taken" },
          409,
        );
      }

      updateData.username = username;
    }

    if (data.email !== undefined) {
      if (typeof data.email !== "string") {
        return jsonResponse(
          request,
          { success: false, message: "Email must be a string" },
          400,
        );
      }

      const email = data.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return jsonResponse(
          request,
          { success: false, message: "Please enter a valid email address" },
          400,
        );
      }

      const existingEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingEmail) {
        return jsonResponse(
          request,
          { success: false, message: "This email is already registered" },
          409,
        );
      }

      updateData.email = email;
    }

    if (data.avatar !== undefined) {
      if (typeof data.avatar !== "string") {
        return jsonResponse(
          request,
          { success: false, message: "Avatar must be a string" },
          400,
        );
      }

      updateData.avatar = data.avatar.trim();
    }

    if (data.bio !== undefined) {
      if (typeof data.bio !== "string") {
        return jsonResponse(
          request,
          { success: false, message: "Bio must be a string" },
          400,
        );
      }

      const bio = data.bio.trim();

      if (bio.length > 300) {
        return jsonResponse(
          request,
          { success: false, message: "Bio cannot exceed 300 characters" },
          400,
        );
      }

      updateData.bio = bio;
    }

    if (Object.keys(updateData).length === 0) {
      return jsonResponse(
        request,
        { success: false, message: "No valid profile data provided" },
        400,
      );
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return jsonResponse(
        request,
        { success: false, message: "User not found" },
        404,
      );
    }

    return jsonResponse(request, {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile API Error:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      const message =
        duplicateField === "username"
          ? "This username is already taken"
          : duplicateField === "email"
            ? "This email is already registered"
            : "Username or email is already in use";

      return jsonResponse(request, { success: false, message }, 409);
    }

    if (error.name === "ValidationError") {
      return jsonResponse(
        request,
        { success: false, message: "Please check your profile details" },
        400,
      );
    }

    return jsonResponse(
      request,
      { success: false, message: "Unable to update profile" },
      500,
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const authResult = authMiddleware(request);

    if (!authResult.success) {
      return jsonResponse(
        request,
        { success: false, message: authResult.message },
        authResult.status,
      );
    }

    const userId = authResult.user?.userId;

    if (!userId) {
      return jsonResponse(
        request,
        { success: false, message: "Invalid authentication token" },
        401,
      );
    }

    let data;

    try {
      data = await request.json();
    } catch {
      return jsonResponse(
        request,
        { success: false, message: "Invalid request data" },
        400,
      );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return jsonResponse(
        request,
        { success: false, message: "Invalid password data" },
        400,
      );
    }

    const { currentPassword, newPassword, confirmPassword } = data;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return jsonResponse(
        request,
        {
          success: false,
          message:
            "Current password, new password and confirm password are required",
        },
        400,
      );
    }

    if (newPassword.length < 8) {
      return jsonResponse(
        request,
        {
          success: false,
          message: "New password must be at least 8 characters",
        },
        400,
      );
    }

    if (newPassword !== confirmPassword) {
      return jsonResponse(
        request,
        { success: false, message: "New passwords do not match" },
        400,
      );
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return jsonResponse(
        request,
        { success: false, message: "User not found" },
        404,
      );
    }

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatched) {
      return jsonResponse(
        request,
        { success: false, message: "Current password is incorrect" },
        400,
      );
    }

    const passwordIsSame = await bcrypt.compare(newPassword, user.password);

    if (passwordIsSame) {
      return jsonResponse(
        request,
        {
          success: false,
          message: "New password must be different from the current password",
        },
        400,
      );
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return jsonResponse(request, {
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password API Error:", error);

    return jsonResponse(
      request,
      { success: false, message: "Unable to change password" },
      500,
    );
  }
}

export async function DELETE(request) {
  return jsonResponse(
    request,
    {
      success: false,
      message:
        "Account deletion is disabled. Your account and data are protected.",
    },
    403,
  );
}
