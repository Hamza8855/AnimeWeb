import {
  getAllCategories,
  getAllCategoriesForAdmin,
  findCategoryById,
  findCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
} from "@/services/category.service";

// GET ALL ACTIVE CATEGORIES

export const getCategories = async () => {
  try {
    const categories = await getAllCategories();

    return {
      success: true,
      status: 200,
      message: "Categories fetched successfully",
      categories,
    };
  } catch (error) {
    console.error("Get Categories Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch categories",
    };
  }
};

// ========================================
// GET ALL CATEGORIES FOR ADMIN
// ========================================

export const getAdminCategories = async () => {
  try {
    const categories = await getAllCategoriesForAdmin();

    return {
      success: true,
      status: 200,
      message: "Admin categories fetched successfully",
      categories,
    };
  } catch (error) {
    console.error("Get Admin Categories Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch categories",
    };
  }
};

// ========================================
// GET SINGLE CATEGORY BY ID
// ========================================

export const getCategory = async (categoryId) => {
  try {
    const category = await findCategoryById(categoryId);

    if (!category) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    if (!category.isActive) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Category fetched successfully",
      category,
    };
  } catch (error) {
    console.error("Get Category Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch category",
    };
  }
};

// ========================================
// GET CATEGORY BY SLUG
// ========================================

export const getCategoryBySlug = async (slug) => {
  try {
    if (!slug) {
      return {
        success: false,
        status: 400,
        message: "Category slug is required",
      };
    }

    const category = await findCategoryBySlug(slug);

    if (!category || !category.isActive) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Category fetched successfully",
      category,
    };
  } catch (error) {
    console.error("Get Category By Slug Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch category",
    };
  }
};

// ========================================
// CREATE CATEGORY - ADMIN
// ========================================

export const addCategory = async (data) => {
  try {
    const { name, slug, description, image, isActive } = data;

    if (!name || !slug) {
      return {
        success: false,
        status: 400,
        message: "Category name and slug are required",
      };
    }

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    const cleanDescription = description ? description.trim() : "";
    const cleanImage = image ? image.trim() : "";

    // Validate category name
    if (cleanName.length < 2) {
      return {
        success: false,
        status: 400,
        message: "Category name must be at least 2 characters",
      };
    }

    if (cleanName.length > 50) {
      return {
        success: false,
        status: 400,
        message: "Category name cannot exceed 50 characters",
      };
    }

    // Validate slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slugRegex.test(cleanSlug)) {
      return {
        success: false,
        status: 400,
        message: "Slug can only contain lowercase letters, numbers and hyphens",
      };
    }

    if (cleanSlug.length < 2) {
      return {
        success: false,
        status: 400,
        message: "Category slug must be at least 2 characters",
      };
    }

    if (cleanSlug.length > 50) {
      return {
        success: false,
        status: 400,
        message: "Category slug cannot exceed 50 characters",
      };
    }

    // Check duplicate name
    const existingName = await getAllCategoriesForAdmin();

    const nameExists = existingName.some(
      (category) => category.name.toLowerCase() === cleanName.toLowerCase(),
    );

    if (nameExists) {
      return {
        success: false,
        status: 409,
        message: "This category name already exists",
      };
    }

    // Check duplicate slug
    const existingSlug = await findCategoryBySlug(cleanSlug);

    if (existingSlug) {
      return {
        success: false,
        status: 409,
        message: "This category slug already exists",
      };
    }

    const category = await createCategory({
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription,
      image: cleanImage,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return {
      success: true,
      status: 201,
      message: "Category created successfully",
      category,
    };
  } catch (error) {
    console.error("Add Category Controller Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        status: 409,
        message: "Category name or slug already exists",
      };
    }

    return {
      success: false,
      status: 500,
      message: "Unable to create category",
    };
  }
};

// ========================================
// UPDATE CATEGORY - ADMIN
// ========================================

export const editCategory = async (categoryId, data) => {
  try {
    const updateData = {};

    // Update name
    if (data.name !== undefined) {
      const cleanName = data.name.trim();

      if (cleanName.length < 2) {
        return {
          success: false,
          status: 400,
          message: "Category name must be at least 2 characters",
        };
      }

      if (cleanName.length > 50) {
        return {
          success: false,
          status: 400,
          message: "Category name cannot exceed 50 characters",
        };
      }

      updateData.name = cleanName;
    }

    // Update slug
    if (data.slug !== undefined) {
      const cleanSlug = data.slug.trim().toLowerCase();

      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

      if (!slugRegex.test(cleanSlug)) {
        return {
          success: false,
          status: 400,
          message:
            "Slug can only contain lowercase letters, numbers and hyphens",
        };
      }

      if (cleanSlug.length < 2) {
        return {
          success: false,
          status: 400,
          message: "Category slug must be at least 2 characters",
        };
      }

      if (cleanSlug.length > 50) {
        return {
          success: false,
          status: 400,
          message: "Category slug cannot exceed 50 characters",
        };
      }

      const existingSlug = await findCategoryBySlug(cleanSlug);

      if (
        existingSlug &&
        existingSlug._id.toString() !== categoryId.toString()
      ) {
        return {
          success: false,
          status: 409,
          message: "This category slug already exists",
        };
      }

      updateData.slug = cleanSlug;
    }

    // Update description
    if (data.description !== undefined) {
      const cleanDescription = data.description.trim();

      if (cleanDescription.length > 300) {
        return {
          success: false,
          status: 400,
          message: "Description cannot exceed 300 characters",
        };
      }

      updateData.description = cleanDescription;
    }

    // Update image
    if (data.image !== undefined) {
      updateData.image = data.image.trim();
    }

    // Update active status
    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        status: 400,
        message: "No valid category data provided",
      };
    }

    const category = await updateCategory(categoryId, updateData);

    if (!category) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Category updated successfully",
      category,
    };
  } catch (error) {
    console.error("Edit Category Controller Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        status: 409,
        message: "Category name or slug already exists",
      };
    }

    return {
      success: false,
      status: 500,
      message: "Unable to update category",
    };
  }
};

// ========================================
// DELETE CATEGORY - ADMIN
// ========================================

export const removeCategory = async (categoryId) => {
  try {
    const category = await deleteCategory(categoryId);

    if (!category) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Category deleted successfully",
    };
  } catch (error) {
    console.error("Delete Category Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to delete category",
    };
  }
};

// ========================================
// ACTIVATE CATEGORY - ADMIN
// ========================================

export const activate = async (categoryId) => {
  try {
    const category = await activateCategory(categoryId);

    if (!category) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Category activated successfully",
      category,
    };
  } catch (error) {
    console.error("Activate Category Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to activate category",
    };
  }
};

// ========================================
// DEACTIVATE CATEGORY - ADMIN
// ========================================

export const deactivate = async (categoryId) => {
  try {
    const category = await deactivateCategory(categoryId);

    if (!category) {
      return {
        success: false,
        status: 404,
        message: "Category not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Category deactivated successfully",
      category,
    };
  } catch (error) {
    console.error("Deactivate Category Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to deactivate category",
    };
  }
};
