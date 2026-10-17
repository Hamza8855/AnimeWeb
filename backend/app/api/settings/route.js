import { NextResponse } from "next/server";
import User from "@/models/User";
import connectDB from "@/config/db";
import Settings from "@/models/Settings";
import authMiddleware from "@/middleware/authMiddleware";

// GET /api/settings
// Public access: website channel settings read kar sakti hai.
export async function GET() {
  try {
    await connectDB();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load settings.",
      },
      { status: 500 },
    );
  }
}

// PUT /api/settings
// Sirf authenticated admin settings update kar sakta hai.
export async function PUT(request) {
  try {
    // 1. Authenticate user.
    const authResult = await authMiddleware(request);

    if (!authResult || authResult.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: authResult?.message || "Authentication required.",
        },
        { status: authResult?.status || 401 },
      );
    }

    // 2. JWT se user ID hasil karein.
    const userId = authResult.user?.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is missing from the authentication token.",
        },
        { status: 401 },
      );
    }

    // 3. MongoDB connect karein.
    await connectDB();

    // 4. Database se current user ka asli role check karein.
    const user = await User.findById(userId).select("role");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found. Please log in again.",
        },
        { status: 401 },
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can update settings.",
        },
        { status: 403 },
      );
    }

    // 5. Request body read karein.
    const body = await request.json();

    const {
      channelName,
      channelDescription,
      logo,
      youtubeUrl,
      githubUrl,
      linkedinUrl,
      contactEmail,
    } = body;

    // 6. Channel name validation.
    if (typeof channelName !== "string" || !channelName.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Channel name is required.",
        },
        { status: 400 },
      );
    }

    if (channelName.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Channel name cannot exceed 100 characters.",
        },
        { status: 400 },
      );
    }

    // 7. Description validation.
    if (
      typeof channelDescription !== "string" ||
      channelDescription.length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Description must be text under 1000 characters.",
        },
        { status: 400 },
      );
    }

    // 8. Email validation.
    if (
      typeof contactEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid contact email.",
        },
        { status: 400 },
      );
    }

    // 9. URL validation.
    const urlFields = {
      logo,
      youtubeUrl,
      githubUrl,
      linkedinUrl,
    };

    for (const [field, value] of Object.entries(urlFields)) {
      if (typeof value !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: `${field} must be a string.`,
          },
          { status: 400 },
        );
      }

      if (!value.trim()) {
        continue;
      }

      try {
        const parsedUrl = new URL(value.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: `Please enter a valid URL for ${field}.`,
          },
          { status: 400 },
        );
      }
    }

    // 10. Settings MongoDB mein save karein.
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          channelName: channelName.trim(),
          channelDescription: channelDescription.trim(),
          logo: logo.trim(),
          youtubeUrl: youtubeUrl.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Settings saved successfully.",
        settings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save settings.",
      },
      { status: 500 },
    );
  }
}
