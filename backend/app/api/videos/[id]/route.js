import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Video from "@/models/Video";
import Category from "@/models/Category";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

/*
| Authentication Helper

| JWT se userId leta hai aur database se actual user fetch karta hai.
| Admin role database se verify hota hai.
*/
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

  if (user.isBlocked) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Your account has been blocked",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    success: true,
    user,
  };
};

/*
|--------------------------------------------------------------------------
| GET /api/videos/:id
|--------------------------------------------------------------------------
| Public API
|
| Guest:
|   Published video only
|
| Normal User:
|   Published video only
|
| Admin:
|   Published + draft videos
|--------------------------------------------------------------------------
*/

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Video ID is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Reuse authentication helper
    |--------------------------------------------------------------------------
    | Authentication optional hai.
    |
    | Agar user logged in hai:
    |   getAuthenticatedUser() user return karega.
    |
    | Agar user logged in nahi hai:
    |   hum public request treat karenge.
    |--------------------------------------------------------------------------
    */

    let authenticatedUser = null;

    const auth = await getAuthenticatedUser(request);

    if (auth.success) {
      authenticatedUser = auth.user;
    }

    /*
    |--------------------------------------------------------------------------
    | Build Query
    |--------------------------------------------------------------------------
    */

    const query = {
      _id: id,
    };

    /*
    |--------------------------------------------------------------------------
    | Admin ko draft videos bhi dikh sakti hain.
    |
    | Guest / Normal User ko sirf published videos.
    |--------------------------------------------------------------------------
    */

    if (!authenticatedUser || authenticatedUser.role !== "admin") {
      query.status = "published";
    }

    /*
    |--------------------------------------------------------------------------
    | Find Video
    |--------------------------------------------------------------------------
    */

    const video = await Video.findOne(query).populate(
      "category",
      "name slug description image",
    );

    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      { $inc: { views: 1 } },
      { new: true },
    ).populate("category", "name slug description image");

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
    console.error("Get Single Video API Error:", error);

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

/*
|--------------------------------------------------------------------------
| PUT /api/videos/:id
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Video ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const existingVideo = await Video.findById(id);

    if (!existingVideo) {
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

    const updateData = {};

    /*
    |--------------------------------------------------------------------------
    | Title
    |--------------------------------------------------------------------------
    */

    if (data.title !== undefined) {
      if (typeof data.title !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Title must be a string",
          },
          {
            status: 400,
          },
        );
      }

      const title = data.title.trim();

      if (title.length < 2) {
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

      if (title.length > 150) {
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

      updateData.title = title;
    }

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    if (data.description !== undefined) {
      if (typeof data.description !== "string") {
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

      const description = data.description.trim();

      if (description.length > 5000) {
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

      updateData.description = description;
    }

    /*
    |--------------------------------------------------------------------------
    | YouTube ID
    |--------------------------------------------------------------------------
    */

    if (data.youtubeId !== undefined) {
      if (typeof data.youtubeId !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "YouTube ID must be a string",
          },
          {
            status: 400,
          },
        );
      }

      const youtubeId = data.youtubeId.trim();

      if (!youtubeId) {
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

      const duplicateVideo = await Video.findOne({
        youtubeId,
        _id: {
          $ne: id,
        },
      });

      if (duplicateVideo) {
        return NextResponse.json(
          {
            success: false,
            message: "This YouTube video already exists",
          },
          {
            status: 409,
          },
        );
      }

      updateData.youtubeId = youtubeId;
    }

    /*
    |--------------------------------------------------------------------------
    | YouTube URL
    |--------------------------------------------------------------------------
    */

    if (data.youtubeUrl !== undefined) {
      if (typeof data.youtubeUrl !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "YouTube URL must be a string",
          },
          {
            status: 400,
          },
        );
      }

      const youtubeUrl = data.youtubeUrl.trim();

      if (!youtubeUrl) {
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

      updateData.youtubeUrl = youtubeUrl;
    }

    /*
    |--------------------------------------------------------------------------
    | Thumbnail
    |--------------------------------------------------------------------------
    */

    if (data.thumbnail !== undefined) {
      if (typeof data.thumbnail !== "string") {
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

      updateData.thumbnail = data.thumbnail.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    if (data.category !== undefined) {
      if (typeof data.category !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Category ID must be a string",
          },
          {
            status: 400,
          },
        );
      }

      const category = await Category.findOne({
        _id: data.category,
        isActive: true,
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected category does not exist or is inactive",
          },
          {
            status: 400,
          },
        );
      }

      updateData.category = category._id;
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    if (data.status !== undefined) {
      if (!["draft", "published"].includes(data.status)) {
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

      updateData.status = data.status;

      if (data.status === "published") {
        if (data.publishedAt !== undefined) {
          const publishedDate = new Date(data.publishedAt);

          if (Number.isNaN(publishedDate.getTime())) {
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

          updateData.publishedAt = publishedDate;
        } else if (!existingVideo.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      if (data.status === "draft") {
        updateData.publishedAt = null;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Published At
    |--------------------------------------------------------------------------
    */

    if (data.publishedAt !== undefined && data.status === undefined) {
      if (data.publishedAt === null) {
        updateData.publishedAt = null;
      } else {
        const publishedDate = new Date(data.publishedAt);

        if (Number.isNaN(publishedDate.getTime())) {
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

        updateData.publishedAt = publishedDate;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Featured
    |--------------------------------------------------------------------------
    */

    if (data.isFeatured !== undefined) {
      let isFeatured = data.isFeatured;

      // Boolean ya admin form se aane wali value validate karo.
      if (typeof isFeatured === "string") {
        if (isFeatured === "true") {
          isFeatured = true;
        } else if (isFeatured === "false") {
          isFeatured = false;
        } else {
          return NextResponse.json(
            {
              success: false,
              message: "isFeatured must be true or false",
            },
            { status: 400 },
          );
        }
      }

      if (typeof isFeatured !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isFeatured must be true or false",
          },
          { status: 400 },
        );
      }

      updateData.isFeatured = isFeatured;
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Empty Update
    |--------------------------------------------------------------------------
    */

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid video data provided",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    const updatedVideo = await Video.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug description image");

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
    console.error("Update Video API Error:", error);

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

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "This YouTube video already exists",
        },
        {
          status: 409,
        },
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
        {
          status: 400,
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

/*
|--------------------------------------------------------------------------
| DELETE /api/videos/:id
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Video ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const video = await Video.findOne(query).populate(
      "category",
      "name slug description image",
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

    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      { $inc: { views: 1 } },
      { new: true },
    ).populate("category", "name slug description image");

    return NextResponse.json(
      {
        success: true,
        message: "Video fetched successfully",
        video: updatedVideo,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Delete Video API Error:", error);

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
