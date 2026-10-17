import bcrypt from "bcryptjs";

import { findUserById, updateUser, deleteUser } from "@/services/user.service";

// ========================================
// GET CURRENT USER PROFILE
// ========================================

export const getProfile = async (userId) => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Profile fetched successfully",
      user,
    };
  } catch (error) {
    console.error("Get Profile Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch profile",
    };
  }
};

// ========================================
// UPDATE CURRENT USER PROFILE
// ========================================

export const updateProfile = async (userId, data) => {
  try {
    const { name, username, avatar, bio } = data;

    const updateData = {};

    // -------------------------
    // Name
    // -------------------------

    if (name !== undefined) {
      const cleanName = name.trim();

      if (cleanName.length < 2) {
        return {
          success: false,
          status: 400,
          message: "Name must be at least 2 characters",
        };
      }

      if (cleanName.length > 50) {
        return {
          success: false,
          status: 400,
          message: "Name cannot exceed 50 characters",
        };
      }

      updateData.name = cleanName;
    }

    // -------------------------
    // Username
    // -------------------------

    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase();

      if (cleanUsername.length < 3) {
        return {
          success: false,
          status: 400,
          message: "Username must be at least 3 characters",
        };
      }

      if (cleanUsername.length > 30) {
        return {
          success: false,
          status: 400,
          message: "Username cannot exceed 30 characters",
        };
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;

      if (!usernameRegex.test(cleanUsername)) {
        return {
          success: false,
          status: 400,
          message: "Username can only contain letters, numbers and underscore",
        };
      }

      updateData.username = cleanUsername;
    }

    // -------------------------
    // Avatar
    // -------------------------

    if (avatar !== undefined) {
      updateData.avatar = avatar.trim();
    }

    // -------------------------
    // Bio
    // -------------------------

    if (bio !== undefined) {
      const cleanBio = bio.trim();

      if (cleanBio.length > 300) {
        return {
          success: false,
          status: 400,
          message: "Bio cannot exceed 300 characters",
        };
      }

      updateData.bio = cleanBio;
    }

    // -------------------------
    // Check empty update
    // -------------------------

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        status: 400,
        message: "No valid profile data provided",
      };
    }

    const updatedUser = await updateUser(userId, updateData);

    if (!updatedUser) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Profile updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Update Profile Controller Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        status: 409,
        message: "This username is already taken",
      };
    }

    return {
      success: false,
      status: 500,
      message: "Unable to update profile",
    };
  }
};

// ========================================
// CHANGE PASSWORD
// ========================================

export const changePassword = async (userId, data) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = data;

    // -------------------------
    // Required fields
    // -------------------------

    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        status: 400,
        message: "All password fields are required",
      };
    }

    // -------------------------
    // Get user with password
    // -------------------------

    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    // IMPORTANT:
    // findUserById() normally excludes password.
    // We need the password separately.
    const User = (await import("@/models/User")).default;

    const userWithPassword = await User.findById(userId).select("+password");

    if (!userWithPassword) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    // -------------------------
    // Check current password
    // -------------------------

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      userWithPassword.password,
    );

    if (!passwordMatched) {
      return {
        success: false,
        status: 400,
        message: "Current password is incorrect",
      };
    }

    // -------------------------
    // Validate new password
    // -------------------------

    if (newPassword.length < 8) {
      return {
        success: false,
        status: 400,
        message: "New password must be at least 8 characters",
      };
    }

    // -------------------------
    // Confirm new password
    // -------------------------

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        status: 400,
        message: "New passwords do not match",
      };
    }

    // -------------------------
    // Hash new password
    // -------------------------

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // -------------------------
    // Update password
    // -------------------------

    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return {
      success: true,
      status: 200,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Change Password Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to change password",
    };
  }
};

// ========================================
// DELETE CURRENT USER ACCOUNT
// ========================================

export const deleteAccount = async (userId) => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    await deleteUser(userId);

    return {
      success: true,
      status: 200,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Delete Account Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to delete account",
    };
  }
};
