import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Settings from "@/models/Settings";
import authMiddleware from "@/middleware/authMiddleware";

// Check login and admin permissions
function checkAdmin(request) {
  const authResult = authMiddleware(request);

  if (!authResult?.success || !authResult?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: authResult?.message || "Please login first.",
        },
        {
          status: authResult?.status || 401,
        },
      ),
    };
  }

  if (authResult.user.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 },
      ),
    };
  }

  return { user: authResult.user };
}

// GET /api/admin/settings
// Fetch channel settings
export async function GET(request) {
  try {
    const auth = checkAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    await connectDB();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    return NextResponse.json(
      {
        success: true,
        message: "Settings fetched successfully.",
        data: settings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Admin Settings Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch settings.",
      },
      { status: 500 },
    );
  }
}

// PUT /api/admin/settings
// Update channel settings
export async function PUT(request) {
  try {
    const auth = checkAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid settings data.",
        },
        { status: 400 },
      );
    }

    const allowedFields = [
      "channelName",
      "channelDescription",
      "logo",
      "youtubeUrl",
      "githubUrl",
      "linkedinUrl",
      "contactEmail",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        if (typeof body[field] !== "string") {
          return NextResponse.json(
            {
              success: false,
              message: `${field} must be a string.`,
            },
            { status: 400 },
          );
        }

        updates[field] = body[field].trim();
      }
    }

    // Validate channel name
    if (updates.channelName !== undefined && !updates.channelName) {
      return NextResponse.json(
        {
          success: false,
          message: "Channel name is required.",
        },
        { status: 400 },
      );
    }

    // Validate contact email
    if (
      updates.contactEmail !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contactEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid contact email.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings({});
    }

    // Update only allowed fields
    for (const [field, value] of Object.entries(updates)) {
      settings.set(field, value);
    }

    await settings.save();

    return NextResponse.json(
      {
        success: true,
        message: "Settings saved successfully.",
        data: settings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT Admin Settings Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save settings.",
      },
      { status: 500 },
    );
  }
}
