import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

// Handle browser CORS preflight request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Get the currently logged-in user
export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "User is not logged in",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked",
        },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Me API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token",
      },
      {
        status: 401,
        headers: corsHeaders,
      },
    );
  }
}
