import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/config/db";
import User from "@/models/User";
import Category from "@/models/Category";
import Video from "@/models/Video";
import authMiddleware from "@/middleware/authMiddleware.js";

const respond = (success, message, status, extra = {}) =>
  NextResponse.json({ success, message, ...extra }, { status });

const getAdminUser = async (request) => {
  const authResult = authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      status: authResult.status,
      message: authResult.message,
    };
  }

  const userId = authResult.user?.userId;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
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
      status: 401,
      message: "Admin account not found",
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

  return { success: true, admin };
};

const getCategoryId = async (params) => {
  const { id } = await params;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return id;
};

const readJsonObject = async (request) => {
  try {
    const data = await request.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const isValidImageValue = (value) => {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > 2048) {
    return false;
  }

  // Existing local image paths are allowed.
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

// GET /api/admin/categories/:id
export async function GET(request, { params }) {
  try {
    await connectDB();

    const auth = await getAdminUser(request);

    if (!auth.success) {
      return respond(false, auth.message, auth.status);
    }

    const id = await getCategoryId(params);

    if (!id) {
      return respond(false, "Invalid category ID", 400);
    }

    const category = await Category.findById(id);

    if (!category) {
      return respond(false, "Category not found", 404);
    }

    const videoCount = await Video.countDocuments({
      category: category._id,
    });

    return NextResponse.json({
      success: true,
      category: {
        ...category.toObject(),
        videoCount,
      },
    });
  } catch (error) {
    console.error("Get category failed:", error.message);

    return respond(false, "Unable to fetch category", 500);
  }
}

// PUT /api/admin/categories/:id
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const auth = await getAdminUser(request);

    if (!auth.success) {
      return respond(false, auth.message, auth.status);
    }

    const id = await getCategoryId(params);

    if (!id) {
      return respond(false, "Invalid category ID", 400);
    }

    const data = await readJsonObject(request);

    if (!data) {
      return respond(false, "Request body must be a valid JSON object", 400);
    }

    const allowedFields = ["name", "slug", "description", "image", "isActive"];

    const unknownFields = Object.keys(data).filter(
      (field) => !allowedFields.includes(field),
    );

    if (unknownFields.length > 0) {
      return respond(false, "Request contains unsupported fields", 400);
    }

    if (Object.keys(data).length === 0) {
      return respond(false, "At least one field is required", 400);
    }

    const category = await Category.findById(id);

    if (!category) {
      return respond(false, "Category not found", 404);
    }

    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
        return respond(false, "Category name must be a string", 400);
      }

      const name = data.name.trim();

      if (name.length < 2 || name.length > 50) {
        return respond(
          false,
          "Category name must be between 2 and 50 characters",
          400,
        );
      }

      const duplicate = await Category.findOne({
        name,
        _id: { $ne: id },
      });

      if (duplicate) {
        return respond(false, "Category name already exists", 409);
      }

      category.name = name;
    }

    if (data.slug !== undefined) {
      if (typeof data.slug !== "string") {
        return respond(false, "Category slug must be a string", 400);
      }

      const slug = data.slug.trim().toLowerCase();

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return respond(false, "Invalid category slug", 400);
      }

      const duplicate = await Category.findOne({
        slug,
        _id: { $ne: id },
      });

      if (duplicate) {
        return respond(false, "Category slug already exists", 409);
      }

      category.slug = slug;
    }

    if (data.description !== undefined) {
      if (
        typeof data.description !== "string" ||
        data.description.trim().length > 300
      ) {
        return respond(
          false,
          "Description must be a string of at most 300 characters",
          400,
        );
      }

      category.description = data.description.trim();
    }

    if (data.image !== undefined) {
      if (!isValidImageValue(data.image)) {
        return respond(false, "Invalid image URL or path", 400);
      }

      category.image = data.image.trim();
    }

    if (data.isActive !== undefined) {
      if (typeof data.isActive !== "boolean") {
        return respond(false, "isActive must be true or false", 400);
      }

      category.isActive = data.isActive;
    }

    await category.save();

    const videoCount = await Video.countDocuments({
      category: category._id,
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category: {
        ...category.toObject(),
        videoCount,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return respond(false, "Category name or slug already exists", 409);
    }

    if (error.name === "ValidationError") {
      return respond(false, "Category validation failed", 400);
    }

    console.error("Update category failed:", error.message);

    return respond(false, "Unable to update category", 500);
  }
}

// DELETE /api/admin/categories/:id
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await getAdminUser(request);

    if (!auth.success) {
      return respond(false, auth.message, auth.status);
    }

    const id = await getCategoryId(params);

    if (!id) {
      return respond(false, "Invalid category ID", 400);
    }

    const category = await Category.findById(id);

    if (!category) {
      return respond(false, "Category not found", 404);
    }

    const videoCount = await Video.countDocuments({
      category: category._id,
    });

    if (videoCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Reassign or remove linked videos before deleting this category",
          videoCount,
        },
        { status: 409 },
      );
    }

    await Category.deleteOne({ _id: category._id });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category failed:", error.message);

    return respond(false, "Unable to delete category", 500);
  }
}
