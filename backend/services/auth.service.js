import User from "@/models/User";

export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).select("+password");
};

export const findUserByUsername = async (username) => {
  return await User.findOne({ username });
};

export const findUserById = async (userId) => {
  return await User.findById(userId).select("-password");
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const updateUser = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");
};
