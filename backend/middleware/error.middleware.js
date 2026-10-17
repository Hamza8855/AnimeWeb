import { NextResponse } from "next/server";

const errorMiddleware = (error) => {
  console.error("API Error:", error);

  if (error?.name === "ValidationError") {
    const errors = {};

    Object.keys(error.errors).forEach((field) => {
      errors[field] = error.errors[field].message;
    });

    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors,
      },
      {
        status: 400,
      },
    );
  }

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];

    return NextResponse.json(
      {
        success: false,
        message: `${duplicateField || "Field"} already exists`,
      },
      {
        status: 409,
      },
    );
  }

  if (error?.name === "JsonWebTokenError") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid authentication token",
      },
      {
        status: 401,
      },
    );
  }

  if (error?.name === "TokenExpiredError") {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication token has expired",
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: error?.message || "Internal server error",
    },
    {
      status: error?.status || 500,
    },
  );
};

export default errorMiddleware;
