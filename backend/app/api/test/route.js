import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://anime-web-c.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Backend connected successfully",
    },
    {
      headers: corsHeaders,
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
