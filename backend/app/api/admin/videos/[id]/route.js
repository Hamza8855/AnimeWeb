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

// GET /api/admin/videos/:id
// Admin single video dekh sakta hai
export async function GET(request, { params }) {
  try {
    await connectDB();

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

    const video = await Video.findById(id).populate(
      "category",
      "name slug description image isActive",
    );

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          message: "Video not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Video fetched successfully",
        video,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin Get Single Video API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid video ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch video",
      },
      {
        status: 500,
      },
    );
  }
}

// PUT /api/admin/videos/:id
// Admin video ko edit karega
export async function PUT(request, { params }) {
  try {
    await connectDB();

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

    const video = await Video.findById(id);

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          message: "Video not found",
        },
        {
          status: 404,
        },
      );
    }

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

    // Title
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: "Video title must be at least 2 characters",
          },
          {
            status: 400,
          },
        );
      }

      if (title.trim().length > 150) {
        return NextResponse.json(
          {
            success: false,
            message: "Video title cannot exceed 150 characters",
          },
          {
            status: 400,
          },
        );
      }

      video.title = title.trim();
    }

    // Description
    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Description must be a string",
          },
          {
            status: 400,
          },
        );
      }

      if (description.trim().length > 5000) {
        return NextResponse.json(
          {
            success: false,
            message: "Description cannot exceed 5000 characters",
          },
          {
            status: 400,
          },
        );
      }

      video.description = description.trim();
    }

    // YouTube ID
    if (youtubeId !== undefined) {
      if (typeof youtubeId !== "string" || !youtubeId.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "YouTube ID cannot be empty",
          },
          {
            status: 400,
          },
        );
      }

      const cleanYoutubeId = youtubeId.trim();

      if (cleanYoutubeId !== video.youtubeId) {
        const existingVideo = await Video.findOne({
          youtubeId: cleanYoutubeId,
          _id: { $ne: id },
        });

        if (existingVideo) {
          return NextResponse.json(
            {
              success: false,
              message: "A video with this YouTube ID already exists",
            },
            {
              status: 409,
            },
          );
        }
      }

      video.youtubeId = cleanYoutubeId;
    }

    // YouTube URL
    if (youtubeUrl !== undefined) {
      if (typeof youtubeUrl !== "string" || !youtubeUrl.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "YouTube URL cannot be empty",
          },
          {
            status: 400,
          },
        );
      }

      video.youtubeUrl = youtubeUrl.trim();
    }

    // Thumbnail
    if (thumbnail !== undefined) {
      if (typeof thumbnail !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Thumbnail must be a string",
          },
          {
            status: 400,
          },
        );
      }

      video.thumbnail = thumbnail.trim();
    }

    // Category
    if (category !== undefined) {
      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "Category is required",
          },
          {
            status: 400,
          },
        );
      }

      const categoryExists = await Category.findById(category);

      if (!categoryExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Category not found",
          },
          {
            status: 404,
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
          },
        );
      }

      video.category = category;
    }

    // Status
    if (status !== undefined) {
      if (!["draft", "published"].includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Status must be draft or published",
          },
          {
            status: 400,
          },
        );
      }

      video.status = status;

      if (status === "published") {
        if (!video.publishedAt) {
          video.publishedAt = new Date();
        }
      }

      if (status === "draft") {
        video.publishedAt = null;
      }
    }

    // Featured
    if (isFeatured !== undefined) {
      if (typeof isFeatured !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isFeatured must be true or false",
          },
          {
            status: 400,
          },
        );
      }

      video.isFeatured = isFeatured;
    }

    // Published At
    if (publishedAt !== undefined) {
      if (publishedAt === null || publishedAt === "") {
        video.publishedAt = null;
      } else {
        const date = new Date(publishedAt);

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid published date",
            },
            {
              status: 400,
            },
          );
        }

        video.publishedAt = date;
      }
    }

    // Draft video should not have publishedAt
    if (video.status === "draft") {
      video.publishedAt = null;
    }

    // Published video should have publishedAt
    if (video.status === "published" && !video.publishedAt) {
      video.publishedAt = new Date();
    }

    await video.save();

    const updatedVideo = await Video.findById(video._id).populate(
      "category",
      "name slug description image isActive",
    );

    return NextResponse.json(
      {
        success: true,
        message: "Video updated successfully",
        video: updatedVideo,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin Update Video API Error:", error);

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
        },
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid video or category ID",
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
          message: "A video with this YouTube ID already exists",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update video",
      },
      {
        status: 500,
      },
    );
  }
}

// PATCH /api/admin/videos/:id
// Admin video ki specific action karega
//
// Supported actions:
// publish
// unpublish
// feature
// unfeature
export async function PATCH(request, { params }) {
  try {
    await connectDB();

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

    const video = await Video.findById(id);

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          message: "Video not found",
        },
        {
          status: 404,
        },
      );
    }

    const data = await request.json();

    const action = data.action;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Action is required",
        },
        {
          status: 400,
        },
      );
    }

    switch (action) {
      case "publish":
        video.status = "published";

        if (!video.publishedAt) {
          video.publishedAt = new Date();
        }

        break;

      case "unpublish":
        video.status = "draft";
        video.publishedAt = null;

        break;

      case "feature":
        video.isFeatured = true;

        break;

      case "unfeature":
        video.isFeatured = false;

        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid action. Use publish, unpublish, feature or unfeature",
          },
          {
            status: 400,
          },
        );
    }

    await video.save();

    const updatedVideo = await Video.findById(video._id).populate(
      "category",
      "name slug description image isActive",
    );

    return NextResponse.json(
      {
        success: true,
        message: `Video ${action} action completed successfully`,
        video: updatedVideo,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin Video Action API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid video ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to perform video action",
      },
      {
        status: 500,
      },
    );
  }
}

// DELETE /api/admin/videos/:id
// Admin video delete karega
export async function DELETE(request, { params }) {
  try {
    await connectDB();

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

    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          message: "Video not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Video deleted successfully",
        video: {
          id: video._id,
          title: video.title,
          youtubeId: video.youtubeId,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin Delete Video API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid video ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete video",
      },
      {
        status: 500,
      },
    );
  }
}
