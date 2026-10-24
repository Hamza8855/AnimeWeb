import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import Video from "@/models/Video";
import Category from "@/models/Category";
import authMiddleware from "@/middleware/authMiddleware";

const getAdminUser = async (request) => {
  const authResult = authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      status: authResult.status,
      message: authResult.message,
    };
  }

  const userId = authResult.user.userId;

  if (!userId) {
    return {
      success: false,
      status: 401,
      message: "Invalid authentication token",
    };
  }

  const admin = await User.findById(userId).select("-password");

  if (!admin) {
    return {
      success: false,
      status: 404,
      message: "Admin user not found",
    };
  }

  if (admin.isBlocked) {
    return {
      success: false,
      status: 403,
      message: "Your account has been blocked",
    };
  }

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://anime-web-c.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET /api/admin/videos
// Admin videos with server-side pagination and filters
export async function GET(request) {
  try {
    await connectDB();

    // 1. Authenticate admin
    const adminAuth = await getAdminUser(request);

    if (!adminAuth.success) {
      return NextResponse.json(
        {
          success: false,
          message: adminAuth.message,
        },
        {
          status: adminAuth.status,
          headers: corsHeaders,
        },
      );
    }

    // 2. Read query parameters
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const featured = searchParams.get("featured");

    // 3. Read pagination settings
    const requestedPage = Number(searchParams.get("page") || 1);
    const requestedLimit = Number(searchParams.get("limit") || 10);

    const page =
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    // Maximum 50 videos per request
    const limit =
      Number.isSafeInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 10;

    // 4. Build database filter
    const filter = {};

    // Escape special regex characters in search input
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by publication status
    if (status === "published" || status === "draft") {
      filter.status = status;
    }

    // Filter by featured status
    if (featured === "true") {
      filter.isFeatured = true;
    } else if (featured === "false") {
      filter.isFeatured = false;
    }

    // 5. Count matching videos
    const totalVideos = await Video.countDocuments(filter);

    const totalPages = Math.ceil(totalVideos / limit);

    // Avoid requesting a page beyond the available results
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

    const skip = (currentPage - 1) * limit;

    // 6. Fetch only the current page
    const videos = await Video.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 7. Return videos and pagination metadata
    return NextResponse.json(
      {
        success: true,
        message: "Admin videos fetched successfully",
        count: videos.length,
        videos,
        pagination: {
          currentPage,
          limit,
          totalVideos,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Admin Get Videos API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch videos",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// POST /api/admin/videos
// Admin creates a new video
export async function POST(request) {
  try {
    await connectDB();

    // 1. Authenticate admin
    const adminAuth = await getAdminUser(request);

    if (!adminAuth.success) {
      return NextResponse.json(
        {
          success: false,
          message: adminAuth.message,
        },
        {
          status: adminAuth.status,
          headers: corsHeaders,
        },
      );
    }

    // 2. Read request body
    let data;

    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const {
      title,
      description,
      youtubeId,
      youtubeUrl,
      thumbnail,
      category,
      status,
      isFeatured,
      publishedAt,
    } = data;

    // 3. Validate required fields
    if (
      typeof title !== "string" ||
      typeof youtubeId !== "string" ||
      typeof youtubeUrl !== "string" ||
      typeof category !== "string" ||
      !title.trim() ||
      !youtubeId.trim() ||
      !youtubeUrl.trim() ||
      !category.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, YouTube ID, YouTube URL and category are required",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const cleanTitle = title.trim();
    const cleanYoutubeId = youtubeId.trim();
    const cleanYoutubeUrl = youtubeUrl.trim();
    const cleanThumbnail =
      typeof thumbnail === "string" ? thumbnail.trim() : "";

    if (cleanTitle.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Video title must be at least 2 characters",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (cleanTitle.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Video title cannot exceed 150 characters",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (cleanYoutubeId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "YouTube ID is too long",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // 4. Validate category
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    if (!categoryExists.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This category is not active",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // 5. Prevent duplicate YouTube IDs
    const existingVideo = await Video.findOne({
      youtubeId: cleanYoutubeId,
    });

    if (existingVideo) {
      return NextResponse.json(
        {
          success: false,
          message: "A video with this YouTube ID already exists",
        },
        {
          status: 409,
          headers: corsHeaders,
        },
      );
    }

    // 6. Validate status
    const videoStatus = status || "published";

    if (!["draft", "published"].includes(videoStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be draft or published",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // 7. Validate publication date
    let finalPublishedAt = null;

    if (videoStatus === "published") {
      if (publishedAt) {
        finalPublishedAt = new Date(publishedAt);

        if (Number.isNaN(finalPublishedAt.getTime())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid publication date",
            },
            {
              status: 400,
              headers: corsHeaders,
            },
          );
        }
      } else {
        finalPublishedAt = new Date();
      }
    }

    // 8. Create video
    const video = await Video.create({
      title: cleanTitle,
      description: typeof description === "string" ? description.trim() : "",
      youtubeId: cleanYoutubeId,
      youtubeUrl: cleanYoutubeUrl,
      thumbnail: cleanThumbnail,
      category,
      status: videoStatus,
      isFeatured: isFeatured === true,
      publishedAt: finalPublishedAt,
    });

    const createdVideo = await Video.findById(video._id).populate(
      "category",
      "name slug",
    );

    return NextResponse.json(
      {
        success: true,
        message: "Video created successfully",
        video: createdVideo,
      },
      {
        status: 201,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Admin Create Video API Error:", error);

    if (error.name === "ValidationError") {
      const errors = {};

      Object.keys(error.errors).forEach((field) => {
        errors[field] = error.errors[field].message;
      });

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A video with this YouTube ID already exists",
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
        message: "Unable to create video",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
