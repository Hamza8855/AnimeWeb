import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

const ALLOWED_ORIGINS = ["https://anime-web-c.vercel.app"];

function getCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return headers;
}

// Handle browser CORS preflight request
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

// Get the currently logged-in user
export async function GET(request) {
  const headers = getCorsHeaders(request);

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
          headers,
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
          headers,
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
          headers,
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
        headers,
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
        headers,
      },
    );
  }
}
