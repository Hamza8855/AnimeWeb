import Category from "@/models/Category";

// Get all active categories
export const getAllCategories = async () => {
  return await Category.find({
    isActive: true,
  }).sort({ name: 1 });
};

// Get all categories for admin
export const getAllCategoriesForAdmin = async () => {
  return await Category.find().sort({ createdAt: -1 });
};

// Get category by ID
export const findCategoryById = async (categoryId) => {
  return await Category.findById(categoryId);
};

// Get category by slug
export const findCategoryBySlug = async (slug) => {
  return await Category.findOne({
    slug: slug.toLowerCase(),
  });
};

// Create category
export const createCategory = async (categoryData) => {
  return await Category.create(categoryData);
};

// Update category
export const updateCategory = async (categoryId, updateData) => {
  return await Category.findByIdAndUpdate(categoryId, updateData, {
    new: true,
    runValidators: true,
  });
};

// Delete category
export const deleteCategory = async (categoryId) => {
  return await Category.findByIdAndDelete(categoryId);
};

// Activate category
export const activateCategory = async (categoryId) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive: true,
    },
    {
      new: true,
    },
  );
};

// Deactivate category
export const deactivateCategory = async (categoryId) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive: false,
    },
    {
      new: true,
    },
  );
};
