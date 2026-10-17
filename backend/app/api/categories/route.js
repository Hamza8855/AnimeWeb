import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Category from "@/models/Category";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

/*
|--------------------------------------------------------------------------
| Get Authenticated User
|--------------------------------------------------------------------------
| JWT se userId leta hai aur MongoDB se actual user fetch karta hai.
| Admin role database se verify hota hai.
|--------------------------------------------------------------------------
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
| GET /api/categories

| Public API
|
| Guest:
|   Active categories dekh sakta hai.
|
| Logged-in User:
|   Active categories dekh sakta hai.
|
| Admin:
|   Is endpoint se bhi active categories dekh sakta hai.
|
| Inactive categories public users ko nahi milengi.
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({
      isActive: true,
    }).sort({
      name: 1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Categories fetched successfully",
        count: categories.length,
        categories,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get Categories API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch categories",
      },
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/categories
|--------------------------------------------------------------------------
| Admin only.
|
| Admin new category create kar sakta hai.
|
| Required:
|   name
|   slug
|
| Optional:
|   description
|   image
|   isActive
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return auth.response;
    }

    /*
    |--------------------------------------------------------------------------
    | Admin Check
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Request Body
    |--------------------------------------------------------------------------
    */

    const data = await request.json();

    const { name, slug, description, image, isActive } = data;

    /*
    |--------------------------------------------------------------------------
    | Required Fields
    |--------------------------------------------------------------------------
    */

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name and slug are required",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Name
    |--------------------------------------------------------------------------
    */

    if (typeof name !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Category name must be a string",
        },
        {
          status: 400,
        },
      );
    }

    const cleanName = name.trim();

    if (cleanName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name must be at least 2 characters",
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
          message: "Category name cannot exceed 50 characters",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Slug
    |--------------------------------------------------------------------------
    */

    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Category slug must be a string",
        },
        {
          status: 400,
        },
      );
    }

    const cleanSlug = slug.trim().toLowerCase();

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slugRegex.test(cleanSlug)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Slug can only contain lowercase letters, numbers and hyphens",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check Duplicate Name
    |--------------------------------------------------------------------------
    */

    const existingName = await Category.findOne({
      name: {
        $regex: `^${cleanName}$`,
        $options: "i",
      },
    });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this name already exists",
        },
        {
          status: 409,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check Duplicate Slug
    |--------------------------------------------------------------------------
    */

    const existingSlug = await Category.findOne({
      slug: cleanSlug,
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists",
        },
        {
          status: 409,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    let cleanDescription = "";

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

      cleanDescription = description.trim();

      if (cleanDescription.length > 300) {
        return NextResponse.json(
          {
            success: false,
            message: "Description cannot exceed 300 characters",
          },
          {
            status: 400,
          },
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    */

    let cleanImage = "";

    if (image !== undefined) {
      if (typeof image !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Image must be a string",
          },
          {
            status: 400,
          },
        );
      }

      cleanImage = image.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | isActive
    |--------------------------------------------------------------------------
    */

    let categoryIsActive = true;

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be true or false",
          },
          {
            status: 400,
          },
        );
      }

      categoryIsActive = isActive;
    }

    /*
    |--------------------------------------------------------------------------
    | Create Category
    |--------------------------------------------------------------------------
    */

    const category = await Category.create({
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription,
      image: cleanImage,
      isActive: categoryIsActive,
    });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create Category API Error:", error);

    /*
    |--------------------------------------------------------------------------
    | Duplicate MongoDB Error
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return NextResponse.json(
        {
          success: false,
          message: `${duplicateField || "Category"} already exists`,
        },
        {
          status: 409,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Mongoose Validation Error
    |--------------------------------------------------------------------------
    */

    if (error.name === "ValidationError") {
      const errors = {};

      Object.keys(error.errors).forEach((field) => {
        errors[field] = error.errors[field].message;
      });

      return NextResponse.json(
        {
          success: false,
          message: "Category validation failed",
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
        message: "Unable to create category",
      },
      {
        status: 500,
      },
    );
  }
}
