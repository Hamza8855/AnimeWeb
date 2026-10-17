import { NextResponse } from "next/server";

export function middleware(request) {
  const origin = request.headers.get("origin");

  // Next.js middleware ko continue karne ke liye response create karte hain
  const response = NextResponse.next();

  // Sirf frontend localhost:3000 ko backend API access ki permission
  // deni hai.
  if (origin === "http://localhost:3000") {
    response.headers.set(
      "Access-Control-Allow-Origin",
      "http://localhost:3000",
    );
  }

  // Browser ko batate hain ke ye HTTP methods allowed hain.
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  // Browser ko batate hain ke ye request headers allowed hain.
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  // HTTP-only cookies ko cross-origin request mein allow karta hai.
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // Different origins ke requests ko separately handle karne ke liye.
  response.headers.set("Vary", "Origin");

  // Browser ki CORS preflight request.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// Middleware sirf /api/... routes par chalega.
export const config = {
  matcher: "/api/:path*",
};
