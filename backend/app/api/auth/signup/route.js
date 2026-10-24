import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { signup } from "@/controllers/auth.controller";

const ALLOWED_ORIGINS = ["https://anime-web-c.vercel.app"];
function getCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return headers;
}

// CORS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

// User signup
export async function POST(request) {
  const headers = getCorsHeaders(request);

  try {
    await connectDB();

    const data = await request.json();
    const result = await signup(data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        {
          status: result.status,
          headers,
        },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: result.message,
        ...(result.user && { user: result.user }),
        ...(result.token && { token: result.token }),
      },
      {
        status: result.status,
        headers,
      },
    );

    if (result.token) {
      response.cookies.set("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error("Signup API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating account",
      },
      {
        status: 500,
        headers,
      },
    );
  }
}
