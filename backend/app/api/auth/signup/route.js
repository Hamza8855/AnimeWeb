import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { signup } from "@/controllers/auth.controller";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

// OPTIONS - CORS Preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST - USER SIGNUP
export async function POST(request) {
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
          headers: corsHeaders,
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
        headers: corsHeaders,
      },
    );

    // Save JWT in HTTP-only cookie
    response.cookies.set("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

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
        headers: corsHeaders,
      },
    );
  }
}
