// import { NextResponse } from "next/server";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "http://localhost:3000",
//   "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
//   "Access-Control-Allow-Credentials": "true",
// };

// export function corsMiddleware(request) {
//   if (request.method === "OPTIONS") {
//     return new NextResponse(null, {
//       status: 204,
//       headers: corsHeaders,
//     });
//   }

//   const response = NextResponse.next();

//   Object.entries(corsHeaders).forEach(([key, value]) => {
//     response.headers.set(key, value);
//   });

//   return response;
// }

//! ye code wo h jo hme error de reha  ager sahi na houa to iss niche wale ko rempve kr de gee

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://anime-web-c.vercel.app",
];

export function corsMiddleware(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  const response = NextResponse.next();

  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}
