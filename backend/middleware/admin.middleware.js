const adminMiddleware = (request, user) => {
  try {
    if (!user) {
      return {
        success: false,
        status: 401,
        message: "Authentication required",
      };
    }

    if (user.role !== "admin") {
      return {
        success: false,
        status: 403,
        message: "Admin access required",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Admin middleware error:", error);

    return {
      success: false,
      status: 500,
      message: "Authorization check failed",
    };
  }
};

export default adminMiddleware;
