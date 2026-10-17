import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

// HELPER
// CHECK ADMIN

const getAuthenticatedUser = async (request) => {
  const authResult = authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        {
          status: authResult.status,
        },
      ),
    };
  }

  const userId = authResult.user.userId;

  if (!userId) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Invalid authentication token",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        },
      ),
    };
  }

  return {
    success: true,
    user,
  };
};

// GET /api/users/[id]
// GET SINGLE USER

export async function GET(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;

    const targetUser = await User.findById(id).select("-password");

    if (!targetUser) {
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

    // ADMIN CAN VIEW ANY USER

    if (auth.user.role === "admin") {
      return NextResponse.json(
        {
          success: true,
          message: "User fetched successfully",
          user: targetUser,
        },
        {
          status: 200,
        },
      );
    }

    // NORMAL USER CAN VIEW ONLY OWN PROFILE

    if (auth.user._id.toString() !== targetUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to view this user",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User fetched successfully",
        user: targetUser,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get Single User API Error:", error);

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

// PUT /api/users/[id]
// UPDATE USER

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;

    const data = await request.json();

    const targetUser = await User.findById(id);

    if (!targetUser) {
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

    // ADMIN

    if (auth.user.role === "admin") {
      // Admin cannot modify own account
      // through user management API

      if (auth.user._id.toString() === targetUser._id.toString()) {
        return NextResponse.json(
          {
            success: false,
            message: "You cannot modify your own account from user management",
          },
          {
            status: 400,
          },
        );
      }

      // Admin cannot modify another admin
      if (targetUser.role === "admin") {
        return NextResponse.json(
          {
            success: false,
            message: "Admin accounts cannot be modified from user management",
          },
          {
            status: 403,
          },
        );
      }

      const updateData = {};

      // -------------------------------
      // Name
      // -------------------------------

      if (data.name !== undefined) {
        const name = data.name.trim();

        if (name.length < 2) {
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

        if (name.length > 50) {
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

        updateData.name = name;
      }

      // -------------------------------
      // Username
      // -------------------------------

      if (data.username !== undefined) {
        const username = data.username.trim().toLowerCase();

        if (username.length < 3) {
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

        if (username.length > 30) {
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

        if (!usernameRegex.test(username)) {
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

        const usernameExists = await User.findOne({
          username,
          _id: {
            $ne: id,
          },
        });

        if (usernameExists) {
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

        updateData.username = username;
      }

      // -------------------------------
      // Avatar
      // -------------------------------

      if (data.avatar !== undefined) {
        updateData.avatar = data.avatar.trim();
      }

      // -------------------------------
      // Bio
      // -------------------------------

      if (data.bio !== undefined) {
        const bio = data.bio.trim();

        if (bio.length > 300) {
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

        updateData.bio = bio;
      }

      // -------------------------------
      // Verification
      // -------------------------------

      if (data.isVerified !== undefined) {
        updateData.isVerified = Boolean(data.isVerified);
      }

      // -------------------------------
      // Block status
      // -------------------------------

      if (data.isBlocked !== undefined) {
        updateData.isBlocked = Boolean(data.isBlocked);
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No valid user data provided",
          },
          {
            status: 400,
          },
        );
      }

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      return NextResponse.json(
        {
          success: true,
          message: "User updated successfully",
          user: updatedUser,
        },
        {
          status: 200,
        },
      );
    }

    // ========================================
    // NORMAL USER
    // ========================================

    if (auth.user._id.toString() !== targetUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only update your own profile",
        },
        {
          status: 403,
        },
      );
    }

    // Normal user cannot change:
    // role, verification, block status

    if (
      data.role !== undefined ||
      data.isVerified !== undefined ||
      data.isBlocked !== undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to modify account permissions",
        },
        {
          status: 403,
        },
      );
    }

    const updateData = {};

    // -------------------------------
    // Name
    // -------------------------------

    if (data.name !== undefined) {
      const name = data.name.trim();

      if (name.length < 2) {
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

      if (name.length > 50) {
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

      updateData.name = name;
    }

    // -------------------------------
    // Username
    // -------------------------------

    if (data.username !== undefined) {
      const username = data.username.trim().toLowerCase();

      if (username.length < 3) {
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

      if (username.length > 30) {
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

      if (!usernameRegex.test(username)) {
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

      const usernameExists = await User.findOne({
        username,
        _id: {
          $ne: id,
        },
      });

      if (usernameExists) {
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

      updateData.username = username;
    }

    // -------------------------------
    // Avatar
    // -------------------------------

    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar.trim();
    }

    // -------------------------------
    // Bio
    // -------------------------------

    if (data.bio !== undefined) {
      const bio = data.bio.trim();

      if (bio.length > 300) {
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
        },
      );
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Update User API Error:", error);

    if (error.code === 11000) {
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

// ========================================
// DELETE /api/users/[id]
// DELETE USER
// ========================================

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;

    const targetUser = await User.findById(id);

    if (!targetUser) {
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

    // ========================================
    // NORMAL USER
    // Can delete ONLY own account
    // ========================================

    if (auth.user.role !== "admin") {
      if (auth.user._id.toString() !== targetUser._id.toString()) {
        return NextResponse.json(
          {
            success: false,
            message: "You can only delete your own account",
          },
          {
            status: 403,
          },
        );
      }

      await User.findByIdAndDelete(id);

      // Remove authentication cookie
      const response = NextResponse.json(
        {
          success: true,
          message: "Your account has been deleted successfully",
        },
        {
          status: 200,
        },
      );

      response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
      });

      return response;
    }

    // ========================================
    // ADMIN
    // ========================================

    // Admin cannot delete own account
    if (auth.user._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account from user management",
        },
        {
          status: 400,
        },
      );
    }

    // Admin cannot delete another admin
    if (targetUser.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin accounts cannot be deleted",
        },
        {
          status: 403,
        },
      );
    }

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
    console.error("Delete User API Error:", error);

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
