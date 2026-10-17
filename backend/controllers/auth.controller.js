import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  findUserByUsername,
  createUser,
} from "@/services/auth.service";

import { generateToken } from "@/lib/auth";

// ========================================
// SIGNUP
// ========================================

export const signup = async (data) => {
  try {
    const { name, username, email, password, confirmPassword } = data;

    // =========================
    // 1. Required fields
    // =========================

    if (!name || !email || !password || !confirmPassword) {
      return {
        success: false,
        status: 400,
        message: "Name, email and password fields are required",
      };
    }

    // =========================
    // 2. Clean data
    // =========================

    const cleanName = name.trim();

    const cleanEmail = email.trim().toLowerCase();

    const cleanUsername = username ? username.trim().toLowerCase() : "";

    // =========================
    // 3. Name validation
    // =========================

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

    // =========================
    // 4. Username validation
    // =========================

    if (cleanUsername) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;

      if (!usernameRegex.test(cleanUsername)) {
        return {
          success: false,
          status: 400,
          message: "Username can only contain letters, numbers and underscore",
        };
      }

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

      // Check existing username
      const existingUsername = await findUserByUsername(cleanUsername);

      if (existingUsername) {
        return {
          success: false,
          status: 409,
          message: "This username is already taken",
        };
      }
    }

    // =========================
    // 5. Email validation
    // =========================

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        status: 400,
        message: "Please enter a valid email address",
      };
    }

    // =========================
    // 6. Password validation
    // =========================

    if (password.length < 8) {
      return {
        success: false,
        status: 400,
        message: "Password must be at least 8 characters",
      };
    }

    // =========================
    // 7. Confirm password
    // =========================

    if (password !== confirmPassword) {
      return {
        success: false,
        status: 400,
        message: "Passwords do not match",
      };
    }

    // =========================
    // 8. Check existing email
    // =========================

    const existingEmail = await findUserByEmail(cleanEmail);

    if (existingEmail) {
      return {
        success: false,
        status: 409,
        message: "An account with this email already exists",
      };
    }

    // =========================
    // 9. Hash password
    // =========================

    const hashedPassword = await bcrypt.hash(password, 12);

    // =========================
    // 10. Create user
    // =========================

    const user = await createUser({
      name: cleanName,

      ...(cleanUsername && {
        username: cleanUsername,
      }),

      email: cleanEmail,

      password: hashedPassword,

      // Signup se hamesha normal user banega
      role: "user",

      isVerified: false,

      isBlocked: false,
    });

    // =========================
    // 11. Generate JWT
    // =========================

    const token = generateToken(user._id.toString());

    // =========================
    // 12. Safe user response
    // =========================

    const safeUser = {
      id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    // =========================
    // 13. Return response
    // =========================

    return {
      success: true,
      status: 201,
      message: "Account created successfully",
      user: safeUser,
      token,
    };
  } catch (error) {
    console.error("Signup Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to create account",
    };
  }
};

// ========================================
// LOGIN
// ========================================

export const login = async (data) => {
  try {
    const { email, password } = data;

    // =========================
    // 1. Required fields
    // =========================

    if (!email || !password) {
      return {
        success: false,
        status: 400,
        message: "Email and password are required",
      };
    }

    // =========================
    // 2. Clean email
    // =========================

    const cleanEmail = email.trim().toLowerCase();

    // =========================
    // 3. Validate email
    // =========================

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        status: 400,
        message: "Please enter a valid email address",
      };
    }

    // =========================
    // 4. Find user
    // =========================

    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return {
        success: false,
        status: 401,
        message: "Invalid email or password",
      };
    }

    // =========================
    // 5. Check blocked account
    // =========================

    if (user.isBlocked) {
      return {
        success: false,
        status: 403,
        message: "Your account has been blocked",
      };
    }

    // =========================
    // 6. Compare password
    // =========================

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      return {
        success: false,
        status: 401,
        message: "Invalid email or password",
      };
    }

    // =========================
    // 7. Generate JWT
    // =========================

    const token = generateToken(user._id.toString());

    // =========================
    // 8. Safe user response
    // =========================

    const safeUser = {
      id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    // 9. Return login result

    return {
      success: true,
      status: 200,
      message: "Login successful",
      user: safeUser,
      token,
    };
  } catch (error) {
    console.error("Login Controller Error:", error);

    return {
      success: false,
      status: 500,
      message: "Unable to login",
    };
  }
};
