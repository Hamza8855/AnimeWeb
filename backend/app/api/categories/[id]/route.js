import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Category from "@/models/Category";
import Video from "@/models/Video";
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
| GET /api/categories/:id
|--------------------------------------------------------------------------
| Public:
|   Active category dekh sakta hai.
|
| Admin:
|   Active + inactive category dekh sakta hai.
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
          message: "Category ID is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Optional Authentication
    |--------------------------------------------------------------------------
    | GET public hai.
    |
    | Agar admin logged in hai to inactive category bhi dekh sakta hai.
    |--------------------------------------------------------------------------
    */

    let isAdmin = false;

    const authResult = authMiddleware(request);

    if (authResult.success) {
      const userId = authResult.user.userId;

      if (userId) {
        const currentUser =
          await User.findById(userId).select("role isBlocked");

        if (
          currentUser &&
          !currentUser.isBlocked &&
          currentUser.role === "admin"
        ) {
          isAdmin = true;
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Find Category
    |--------------------------------------------------------------------------
    */

    const query = {
      _id: id,
    };

    /*
    |--------------------------------------------------------------------------
    | Normal user / Guest:
    | Only active category
    |
    | Admin:
    | Active + inactive category
    |--------------------------------------------------------------------------
    */

    if (!isAdmin) {
      query.isActive = true;
    }

    const category = await Category.findOne(query);

    if (!category) {
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

    /*
    |--------------------------------------------------------------------------
    | Get Video Count
    |--------------------------------------------------------------------------
    */

    const videoCount = await Video.countDocuments({
      category: category._id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category fetched successfully",
        category,
        videoCount,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get Single Category API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch category",
      },
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/categories/:id
|--------------------------------------------------------------------------
| Admin only.
|
| Admin can:
|   - Edit name
|   - Edit slug
|   - Edit description
|   - Edit image
|   - Activate category
|   - Deactivate category
|--------------------------------------------------------------------------
*/

export async function PUT(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Existing Category
    |--------------------------------------------------------------------------
    */

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
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

    const data = await request.json();

    const updateData = {};

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
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

      const cleanName = data.name.trim();

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
      | Check Duplicate Name
      |--------------------------------------------------------------------------
      */

      const existingName = await Category.findOne({
        name: {
          $regex: `^${cleanName}$`,
          $options: "i",
        },
        _id: {
          $ne: id,
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

      updateData.name = cleanName;
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    if (data.slug !== undefined) {
      if (typeof data.slug !== "string") {
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

      const cleanSlug = data.slug.trim().toLowerCase();

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
      | Check Duplicate Slug
      |--------------------------------------------------------------------------
      */

      const existingSlug = await Category.findOne({
        slug: cleanSlug,
        _id: {
          $ne: id,
        },
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

      updateData.slug = cleanSlug;
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

      if (description.length > 300) {
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

      updateData.description = description;
    }

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    */

    if (data.image !== undefined) {
      if (typeof data.image !== "string") {
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

      updateData.image = data.image.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Active / Inactive
    |--------------------------------------------------------------------------
    */

    if (data.isActive !== undefined) {
      if (typeof data.isActive !== "boolean") {
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

      updateData.isActive = data.isActive;
    }

    /*
    |--------------------------------------------------------------------------
    | No Data
    |--------------------------------------------------------------------------
    */

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid category data provided",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update Category
    |--------------------------------------------------------------------------
    */

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        category: updatedCategory,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Update Category API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        {
          status: 400,
        },
      );
    }

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
        message: "Unable to update category",
      },
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/categories/:id
|--------------------------------------------------------------------------
| Admin only.
|
| Important:
| Agar category ke andar videos hain to category delete
| nahi hogi. Pehle videos ko kisi doosri category mein
| move karna hoga.
|--------------------------------------------------------------------------
*/

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Category
    |--------------------------------------------------------------------------
    */

    const category = await Category.findById(id);

    if (!category) {
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

    /*
    |--------------------------------------------------------------------------
    | Check Related Videos
    |--------------------------------------------------------------------------
    */

    const videoCount = await Video.countDocuments({
      category: category._id,
    });

    if (videoCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This category cannot be deleted because videos are using it",
          videoCount,
        },
        {
          status: 409,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Category
    |--------------------------------------------------------------------------
    */

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Delete Category API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete category",
      },
      {
        status: 500,
      },
    );
  }
}
