import User from "@/models/User";

// Get all users
export const getAllUsers = async () => {
  return await User.find().select("-password").sort({ createdAt: -1 });
};

// Get user by ID
export const findUserById = async (userId) => {
  return await User.findById(userId).select("-password");
};

// Get user by email
export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).select("-password");
};

// Create a new user
export const createUser = async (userData) => {
  return await User.create(userData);
};

// Update user
export const updateUser = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");
};

// Delete user
export const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};

// Block user
export const blockUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      isBlocked: true,
    },
    {
      new: true,
    },
  ).select("-password");
};

// Unblock user
export const unblockUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      isBlocked: false,
    },
    {
      new: true,
    },
  ).select("-password");
};

// Verify user
export const verifyUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      isVerified: true,
    },
    {
      new: true,
    },
  ).select("-password");
};
