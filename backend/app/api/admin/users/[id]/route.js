import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

// HELPER
// Authenticate admin from JWT / Cookie

const getAdminUser = async (request) => {
  // Step 1: Authentication

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

  // Step 4: Check if admin is blocked

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

// ======================================================
// GET /api/admin/users/:id
//
// Specific user ki information.
// Sirf admin access kar sakta hai.
// ======================================================

export async function GET(request, { params }) {
  try {
    await connectDB();

    // ==================================================
    // ADMIN AUTHENTICATION
    // ==================================================

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

    const user = await User.findById(id).select("-password");

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

    return NextResponse.json(
      {
        success: true,
        message: "User fetched successfully",
        user,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get Admin User API Error:", error);

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
        message: "Unable to fetch user",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// PUT /api/admin/users/:id
//
// Admin user ki profile information update kar sakta hai.
//
// Allowed:
// - name
// - username
// - avatar
// - bio
// - isVerified
//
// Role/password/isBlocked PUT se change nahi honge.
// ======================================================

export async function PUT(request, { params }) {
  try {
    await connectDB();

    // ==================================================
    // ADMIN AUTHENTICATION
    // ==================================================

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

    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body = await request.json();

    // Prevent sensitive fields

    const forbiddenFields = ["password", "role", "isBlocked"];

    const hasForbiddenField = forbiddenFields.some((field) =>
      Object.prototype.hasOwnProperty.call(body, field),
    );

    if (hasForbiddenField) {
      return NextResponse.json(
        {
          success: false,
          message: "Password, role and block status cannot be changed with PUT",
        },
        {
          status: 400,
        },
      );
    }

    // NAME

    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be a string",
          },
          {
            status: 400,
          },
        );
      }

      const cleanName = body.name.trim();

      if (cleanName.length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be at least 2 characters",
          },
          {
            status: 400,
          },
        );
      }

      if (cleanName.length > 50) {
        return NextResponse.json(
          {
            success: false,
            message: "Name cannot exceed 50 characters",
          },
          {
            status: 400,
          },
        );
      }

      user.name = cleanName;
    }

    // ==================================================
    // USERNAME
    // ==================================================

    if (Object.prototype.hasOwnProperty.call(body, "username")) {
      if (body.username === null || body.username === "") {
        user.username = undefined;
      } else {
        if (typeof body.username !== "string") {
          return NextResponse.json(
            {
              success: false,
              message: "Username must be a string",
            },
            {
              status: 400,
            },
          );
        }

        const cleanUsername = body.username.trim().toLowerCase();

        if (cleanUsername.length < 3) {
          return NextResponse.json(
            {
              success: false,
              message: "Username must be at least 3 characters",
            },
            {
              status: 400,
            },
          );
        }

        if (cleanUsername.length > 30) {
          return NextResponse.json(
            {
              success: false,
              message: "Username cannot exceed 30 characters",
            },
            {
              status: 400,
            },
          );
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;

        if (!usernameRegex.test(cleanUsername)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Username can only contain letters, numbers and underscore",
            },
            {
              status: 400,
            },
          );
        }

        const existingUsername = await User.findOne({
          username: cleanUsername,
          _id: {
            $ne: user._id,
          },
        });

        if (existingUsername) {
          return NextResponse.json(
            {
              success: false,
              message: "This username is already taken",
            },
            {
              status: 409,
            },
          );
        }

        user.username = cleanUsername;
      }
    }

    // ==================================================
    // AVATAR
    // ==================================================

    if (Object.prototype.hasOwnProperty.call(body, "avatar")) {
      if (typeof body.avatar !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Avatar must be a string",
          },
          {
            status: 400,
          },
        );
      }

      user.avatar = body.avatar.trim();
    }

    // ==================================================
    // BIO
    // ==================================================

    if (Object.prototype.hasOwnProperty.call(body, "bio")) {
      if (typeof body.bio !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Bio must be a string",
          },
          {
            status: 400,
          },
        );
      }

      const cleanBio = body.bio.trim();

      if (cleanBio.length > 300) {
        return NextResponse.json(
          {
            success: false,
            message: "Bio cannot exceed 300 characters",
          },
          {
            status: 400,
          },
        );
      }

      user.bio = cleanBio;
    }

    // ==================================================
    // VERIFY USER
    // ==================================================

    if (Object.prototype.hasOwnProperty.call(body, "isVerified")) {
      if (typeof body.isVerified !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isVerified must be true or false",
          },
          {
            status: 400,
          },
        );
      }

      user.isVerified = body.isVerified;
    }

    // ==================================================
    // SAVE
    // ==================================================

    await user.save();

    // Password remove karke response.
    const safeUser = await User.findById(user._id).select("-password");

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        user: safeUser,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Update Admin User API Error:", error);

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

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Username or email already exists",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update user",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// PATCH /api/admin/users/:id
//
// Admin actions:
//
// block
// unblock
// verify
//
// Body:
//
// {
//   "action": "block"
// }
//
// OR
//
// {
//   "action": "unblock"
// }
//
// OR
//
// {
//   "action": "verify"
// }
// ======================================================

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    // ==================================================
    // ADMIN AUTHENTICATION
    // ==================================================

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

    const admin = adminAuth.admin;

    // ==================================================
    // GET USER ID
    // ==================================================

    const { id } = await params;

    // ==================================================
    // PREVENT ADMIN FROM MODIFYING OWN STATUS
    // ==================================================

    if (admin._id.toString() === id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot change your own account status",
        },
        {
          status: 400,
        },
      );
    }

    // ==================================================
    // FIND USER
    // ==================================================

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

    // REQUEST BODY

    const body = await request.json();

    const { action } = body;

    // VALIDATE ACTION

    if (!["block", "unblock", "verify"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be block, unblock or verify",
        },
        {
          status: 400,
        },
      );
    }

    // BLOCK

    if (action === "block") {
      user.isBlocked = true;
    }

    // UNBLOCK

    if (action === "unblock") {
      user.isBlocked = false;
    }

    // VERIFY

    if (action === "verify") {
      user.isVerified = true;
    }

    // SAVE

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    return NextResponse.json(
      {
        success: true,
        message:
          action === "block"
            ? "User blocked successfully"
            : action === "unblock"
              ? "User unblocked successfully"
              : "User verified successfully",

        user: safeUser,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin User Action API Error:", error);

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
        message: "Unable to perform user action",
      },
      {
        status: 500,
      },
    );
  }
}

// DELETE /api/admin/users/:id
//
// Admin user delete kar sakta hai.
//
// Admin khud ko delete nahi kar sakta.

export async function DELETE(request, { params }) {
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

    const admin = adminAuth.admin;

    // GET USER ID

    const { id } = await params;

    // PREVENT SELF DELETE

    if (admin._id.toString() === id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own admin account",
        },
        {
          status: 400,
        },
      );
    }

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

    // ==================================================
    // DELETE USER
    // ==================================================

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Delete Admin User API Error:", error);

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
        message: "Unable to delete user",
      },
      {
        status: 500,
      },
    );
  }
}
