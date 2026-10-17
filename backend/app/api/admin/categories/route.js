import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import Category from "@/models/Category";
import Video from "@/models/Video";
import authMiddleware from "@/middleware/authMiddleware.js";

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

// GET /api/admin/categories
// Admin ko tamam categories milengi
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    const status = searchParams.get("status")?.trim() || "";

    const filter = {};

    // Search by name, slug or description
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Filter active/inactive categories
    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    const categories = await Category.find(filter).sort({
      createdAt: -1,
    });

    // Har category ke saath video count
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const videoCount = await Video.countDocuments({
          category: category._id,
        });

        return {
          ...category.toObject(),
          videoCount,
        };
      }),
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin categories fetched successfully",
        count: categoriesWithCount.length,
        categories: categoriesWithCount,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Admin Get Categories API Error:", error);

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

// POST /api/admin/categories
// Admin new category create karega
export async function POST(request) {
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

    const data = await request.json();

    const { name, slug, description, image, isActive } = data;

    // Required fields
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

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();

    const cleanDescription = description?.trim() || "";

    const cleanImage = image?.trim() || "";

    // Name validation
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

    // Slug validation
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

    // Description validation
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

    // Check duplicate name
    const existingName = await Category.findOne({
      name: cleanName,
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

    // Check duplicate slug
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

    const category = await Category.create({
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription,
      image: cleanImage,
      isActive: isActive === undefined ? true : isActive === true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category: {
          ...category.toObject(),
          videoCount: 0,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Admin Create Category API Error:", error);

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
