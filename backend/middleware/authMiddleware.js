import jwt from "jsonwebtoken";

const authMiddleware = (request) => {
  try {
    // ========================================
    // 1. Get token from Authorization header
    // ========================================

    const authHeader = request.headers.get("authorization");

    let token = null;

    if (authHeader) {
      const parts = authHeader.split(" ");

      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    // ========================================
    // 2. If header token not found,
    //    get token from cookie
    // ========================================

    if (!token) {
      token = request.cookies.get("token")?.value;
    }

    // ========================================
    // 3. Token not found
    // ========================================

    if (!token) {
      return {
        success: false,
        status: 401,
        message: "Authentication token is required",
      };
    }

    // ========================================
    // 4. Verify JWT
    // ========================================

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ========================================
    // 5. Return authenticated user
    // ========================================

    return {
      success: true,
      user: decoded,
    };
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    // ========================================
    // Token expired
    // ========================================

    if (error.name === "TokenExpiredError") {
      return {
        success: false,
        status: 401,
        message: "Authentication token has expired",
      };
    }

    // ========================================
    // Invalid token
    // ========================================

    if (error.name === "JsonWebTokenError") {
      return {
        success: false,
        status: 401,
        message: "Invalid authentication token",
      };
    }

    // ========================================
    // Other authentication errors
    // ========================================

    return {
      success: false,
      status: 401,
      message: "Unauthorized",
    };
  }
};

export default authMiddleware;
