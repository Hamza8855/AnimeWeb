import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

// HELPER
// Authenticate user and verify admin role

const getAdminUser = async (request) => {
  // Step 1: JWT / Cookie authentication

  const authResult = authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      status: authResult.status,
      message: authResult.message,
    };
  }

  // Step 2: JWT se userId

  const userId = authResult.user.userId;

  if (!userId) {
    return {
      success: false,
      status: 401,
      message: "Invalid authentication token",
    };
  }

  // ----------------------------------------------------
  // Step 3: Database se actual user
  // ----------------------------------------------------

  const currentUser = await User.findById(userId).select("-password");

  if (!currentUser) {
    return {
      success: false,
      status: 404,
      message: "User not found",
    };
  }

  // Step 4: Blocked admin check

  if (currentUser.isBlocked) {
    return {
      success: false,
      status: 403,
      message: "Your account has been blocked",
    };
  }

  // Step 5: Admin role check

  if (currentUser.role !== "admin") {
    return {
      success: false,
      status: 403,
      message: "Admin access required",
    };
  }

  return {
    success: true,
    user: currentUser,
  };
};

// ======================================================
// GET /api/admin/users
//
// Admin ko users ki complete list milegi.
//
// Optional filters:
//
// /api/admin/users?role=user
// /api/admin/users?role=admin
//
// /api/admin/users?blocked=true
// /api/admin/users?blocked=false
//
// /api/admin/users?verified=true
// /api/admin/users?verified=false
// ======================================================

export async function GET(request) {
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

    // QUERY PARAMETERS

    const { searchParams } = new URL(request.url);

    const role = searchParams.get("role");

    const blocked = searchParams.get("blocked");

    const verified = searchParams.get("verified");

    const search = searchParams.get("search");

    // BUILD FILTER

    const filter = {};

    // Role filter

    if (role) {
      if (role !== "user" && role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            message: "Role must be either user or admin",
          },
          {
            status: 400,
          },
        );
      }

      filter.role = role;
    }

    // Blocked filter

    if (blocked !== null) {
      if (blocked === "true") {
        filter.isBlocked = true;
      }

      if (blocked === "false") {
        filter.isBlocked = false;
      }
    }

    // Verified filter

    if (verified !== null) {
      if (verified === "true") {
        filter.isVerified = true;
      }

      if (verified === "false") {
        filter.isVerified = false;
      }
    }

    // Search filter

    if (search && search.trim()) {
      const cleanSearch = search.trim();

      filter.$or = [
        {
          name: {
            $regex: cleanSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: cleanSearch,
            $options: "i",
          },
        },
        {
          username: {
            $regex: cleanSearch,
            $options: "i",
          },
        },
      ];
    }

    // GET USERS

    const users = await User.find(filter).select("-password").sort({
      createdAt: -1,
    });

    // USER STATISTICS

    const totalUsers = await User.countDocuments();

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const totalNormalUsers = await User.countDocuments({
      role: "user",
    });

    const blockedUsers = await User.countDocuments({
      isBlocked: true,
    });

    const verifiedUsers = await User.countDocuments({
      isVerified: true,
    });

    const unverifiedUsers = await User.countDocuments({
      isVerified: false,
    });

    // RESPONSE

    return NextResponse.json(
      {
        success: true,
        message: "Users fetched successfully",

        users,

        count: users.length,

        statistics: {
          totalUsers,
          totalAdmins,
          totalNormalUsers,
          blockedUsers,
          verifiedUsers,
          unverifiedUsers,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin Users API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch users",
      },
      {
        status: 500,
      },
    );
  }
}
