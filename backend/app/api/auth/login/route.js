import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import { login } from "@/controllers/auth.controller";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://anime-web-c.vercel.app",
];

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

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request) {
  const headers = getCorsHeaders(request);

  try {
    await connectDB();

    const data = await request.json();
    const result = await login(data);

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
        user: result.user,
      },
      {
        status: result.status,
        headers,
      },
    );

    response.cookies.set("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
        headers,
      },
    );
  }
}
