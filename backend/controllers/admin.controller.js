import {
  getAllUsers,
  findUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  verifyUser,
} from "@/services/user.service";

// ========================================
// GET ALL USERS - ADMIN
// ========================================

export const getUsers = async () => {
  try {
    const users = await getAllUsers();

    return {
      success: true,
      status: 200,
      message: "Users fetched successfully",
      users,
    };
  } catch (error) {
    console.error("Get Users Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch users",
    };
  }
};

// ========================================
// GET SINGLE USER - ADMIN
// ========================================

export const getUser = async (userId) => {
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
      message: "User fetched successfully",
      user,
    };
  } catch (error) {
    console.error("Get User Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to fetch user",
    };
  }
};

// ========================================
// VERIFY USER - ADMIN
// ========================================

export const verify = async (userId) => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    if (user.isVerified) {
      return {
        success: true,
        status: 200,
        message: "User is already verified",
        user,
      };
    }

    const updatedUser = await verifyUser(userId);

    return {
      success: true,
      status: 200,
      message: "User verified successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Verify User Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to verify user",
    };
  }
};

// ========================================
// BLOCK USER - ADMIN
// ========================================

export const block = async (userId, currentAdminId) => {
  try {
    // Admin cannot block himself
    if (userId.toString() === currentAdminId.toString()) {
      return {
        success: false,
        status: 400,
        message: "You cannot block your own account",
      };
    }

    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    // Prevent blocking another admin
    if (user.role === "admin") {
      return {
        success: false,
        status: 403,
        message: "Admin accounts cannot be blocked",
      };
    }

    if (user.isBlocked) {
      return {
        success: true,
        status: 200,
        message: "User is already blocked",
        user,
      };
    }

    const updatedUser = await blockUser(userId);

    return {
      success: true,
      status: 200,
      message: "User blocked successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Block User Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to block user",
    };
  }
};

// ========================================
// UNBLOCK USER - ADMIN
// ========================================

export const unblock = async (userId) => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    if (!user.isBlocked) {
      return {
        success: true,
        status: 200,
        message: "User is already unblocked",
        user,
      };
    }

    const updatedUser = await unblockUser(userId);

    return {
      success: true,
      status: 200,
      message: "User unblocked successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Unblock User Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to unblock user",
    };
  }
};

// ========================================
// DELETE USER - ADMIN
// ========================================

export const removeUser = async (userId, currentAdminId) => {
  try {
    // Admin cannot delete himself
    if (userId.toString() === currentAdminId.toString()) {
      return {
        success: false,
        status: 400,
        message: "You cannot delete your own account",
      };
    }

    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    // Prevent deleting another admin
    if (user.role === "admin") {
      return {
        success: false,
        status: 403,
        message: "Admin accounts cannot be deleted",
      };
    }

    await deleteUser(userId);

    return {
      success: true,
      status: 200,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Delete User Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to delete user",
    };
  }
};

// ========================================
// UPDATE USER - ADMIN
// ========================================

export const editUser = async (userId, data, currentAdminId) => {
  try {
    // Prevent admin from modifying himself
    if (userId.toString() === currentAdminId.toString()) {
      return {
        success: false,
        status: 400,
        message: "You cannot modify your own account from user management",
      };
    }

    const user = await findUserById(userId);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
      };
    }

    // Prevent modifying another admin
    if (user.role === "admin") {
      return {
        success: false,
        status: 403,
        message: "Admin accounts cannot be modified from user management",
      };
    }

    const updateData = {};

    // Name
    if (data.name !== undefined) {
      const cleanName = data.name.trim();

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

    // Username
    if (data.username !== undefined) {
      const cleanUsername = data.username.trim().toLowerCase();

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

    // Avatar
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar.trim();
    }

    // Bio
    if (data.bio !== undefined) {
      const cleanBio = data.bio.trim();

      if (cleanBio.length > 300) {
        return {
          success: false,
          status: 400,
          message: "Bio cannot exceed 300 characters",
        };
      }

      updateData.bio = cleanBio;
    }

    // Verified status
    if (data.isVerified !== undefined) {
      updateData.isVerified = Boolean(data.isVerified);
    }

    // Blocked status
    if (data.isBlocked !== undefined) {
      updateData.isBlocked = Boolean(data.isBlocked);
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        status: 400,
        message: "No valid user data provided",
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
      message: "User updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Edit User Controller Error:", error);

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
      message: "Unable to update user",
    };
  }
};
