import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Video from "@/models/Video";
import Category from "@/models/Category";
import authMiddleware from "@/middleware/authMiddleware";
import User from "@/models/User";

// ========================================
// HELPER: GET AUTHENTICATED USER
// ========================================

const getAuthenticatedUser = async (request) => {
  const authResult = await authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        { status: authResult.status },
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
        { status: 401 },
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
        { status: 404 },
      ),
    };
  }

  return {
    success: true,
    user,
  };
};

// ========================================
// GET /api/videos
// PUBLIC: GET PUBLISHED VIDEOS
// SUPPORTS PAGINATION, SEARCH, CATEGORY
// ========================================

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");

    // 1. Pagination
    const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);

    const requestedLimit = Number.parseInt(
      searchParams.get("limit") || "12",
      10,
    );

    const page =
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isSafeInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 48)
        : 12;

    // 2. Public videos must be published
    const query = {
      status: "published",
    };

    // Featured filter
    if (featured === "true") {
      query.isFeatured = true;
    }

    // 3. Category filter
    if (category?.trim()) {
      const cleanCategory = category.trim();
      const categoryConditions = [{ slug: cleanCategory.toLowerCase() }];

      if (/^[a-f\d]{24}$/i.test(cleanCategory)) {
        categoryConditions.push({ _id: cleanCategory });
      }

      const categoryExists = await Category.findOne({
        $or: categoryConditions,
        isActive: true,
      });

      if (!categoryExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Category not found",
          },
          { status: 404 },
        );
      }

      query.category = categoryExists._id;
    }

    // 4. Search filter
    if (search?.trim()) {
      const cleanSearch = search.trim().slice(0, 100);

      // Escape special regex characters
      const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.$or = [
        {
          title: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    // 5. Count matching videos before pagination
    const totalVideos = await Video.countDocuments(query);
    const totalPages = Math.ceil(totalVideos / limit);

    // 6. Fetch only the requested page
    const videos =
      totalPages === 0 || page > totalPages
        ? []
        : await Video.find(query)
            .populate("category", "name slug description image")
            .sort({
              publishedAt: -1,
              createdAt: -1,
              _id: -1,
            })
            .skip((page - 1) * limit)
            .limit(limit);

    // 7. Response
    return NextResponse.json(
      {
        success: true,
        message: "Videos fetched successfully",
        count: videos.length,
        totalVideos,
        currentPage: page,
        totalPages,
        limit,
        hasPreviousPage: page > 1 && totalPages > 0,
        hasNextPage: page < totalPages,
        videos,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get Videos API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch videos",
      },
      { status: 500 },
    );
  }
}

// ========================================
// POST /api/videos
// CREATE VIDEO — ADMIN ONLY
// ========================================

export async function POST(request) {
  try {
    await connectDB();

    // 1. Authenticate
    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    // 2. Admin check
    if (auth.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 },
      );
    }

    // 3. Request body
    const data = await request.json();

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

    // 4. Required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof youtubeId !== "string" ||
      !youtubeId.trim() ||
      typeof youtubeUrl !== "string" ||
      !youtubeUrl.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, YouTube ID, YouTube URL and category are required",
        },
        { status: 400 },
      );
    }

    const cleanTitle = title.trim();

    if (cleanTitle.length < 2 || cleanTitle.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Video title must be between 2 and 150 characters",
        },
        { status: 400 },
      );
    }

    // 5. Clean values
    const cleanYoutubeId = youtubeId.trim();
    const cleanYoutubeUrl = youtubeUrl.trim();
    const cleanThumbnail =
      typeof thumbnail === "string" ? thumbnail.trim() : "";
    const cleanDescription =
      typeof description === "string" ? description.trim() : "";

    // 6. Validate category ID
    if (!/^[a-f\d]{24}$/i.test(category)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 },
      );
    }

    const categoryExists = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected category does not exist or is inactive",
        },
        { status: 400 },
      );
    }

    // 7. Check duplicate YouTube video
    const existingVideo = await Video.findOne({
      youtubeId: cleanYoutubeId,
    });

    if (existingVideo) {
      return NextResponse.json(
        {
          success: false,
          message: "This YouTube video already exists",
        },
        { status: 409 },
      );
    }

    // 8. Validate status
    const videoStatus = status || "published";

    if (!["draft", "published"].includes(videoStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be draft or published",
        },
        { status: 400 },
      );
    }

    // 9. Published date
    let videoPublishedAt = null;

    if (videoStatus === "published") {
      videoPublishedAt = publishedAt ? new Date(publishedAt) : new Date();

      if (Number.isNaN(videoPublishedAt.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid published date",
          },
          { status: 400 },
        );
      }
    }

    // 10. Create video
    const video = await Video.create({
      title: cleanTitle,
      description: cleanDescription,
      youtubeId: cleanYoutubeId,
      youtubeUrl: cleanYoutubeUrl,
      thumbnail: cleanThumbnail,
      category: categoryExists._id,
      status: videoStatus,
      isFeatured: Boolean(isFeatured),
      publishedAt: videoPublishedAt,
    });

    // 11. Populate category
    const populatedVideo = await Video.findById(video._id).populate(
      "category",
      "name slug description image",
    );

    return NextResponse.json(
      {
        success: true,
        message: "Video created successfully",
        video: populatedVideo,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create Video API Error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "This YouTube video already exists",
        },
        { status: 409 },
      );
    }

    if (error.name === "ValidationError") {
      const errors = {};

      Object.keys(error.errors).forEach((field) => {
        errors[field] = error.errors[field].message;
      });

      return NextResponse.json(
        {
          success: false,
          message: "Video validation failed",
          errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create video",
      },
      { status: 500 },
    );
  }
}
