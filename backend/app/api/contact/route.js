import { NextResponse } from "next/server";

import connectDB from "@/config/db";
import Contact from "@/models/Contact";
import User from "@/models/User";
import authMiddleware from "@/middleware/authMiddleware";

// HELPER
// Get authenticated user from JWT

const getAuthenticatedUser = async (request) => {
  const authResult = authMiddleware(request);

  if (!authResult.success) {
    return {
      success: false,
      status: authResult.status,
      message: authResult.message,
    };
  }

  const userId = authResult.user.userId;

  if (!userId) {
    return {
      success: false,
      status: 401,
      message: "Invalid authentication token",
    };
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return {
      success: false,
      status: 404,
      message: "User not found",
    };
  }

  if (user.isBlocked) {
    return {
      success: false,
      status: 403,
      message: "Your account has been blocked",
    };
  }

  return {
    success: true,
    user,
  };
};

// ======================================================
// POST /api/contact
//
// Contact form se message send karna.
//
// Body:
//
// {
//   "name": "Hamza",
//   "email": "hamza@example.com",
//   "subject": "Video Suggestion",
//   "message": "Please make a video about..."
// }
// ======================================================

export async function POST(request) {
  try {
    await connectDB();

    // ==================================================
    // GET REQUEST BODY
    // ==================================================

    const body = await request.json();

    const { name, email, subject, message } = body;

    // ==================================================
    // REQUIRED FIELDS
    // ==================================================

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, subject and message are required",
        },
        {
          status: 400,
        },
      );
    }

    // CLEAN DATA

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // NAME VALIDATION

    if (cleanName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be at least 2 characters",
        },
        {
          status: 400,
        },
      );
    }

    if (cleanName.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Name cannot exceed 50 characters",
        },
        {
          status: 400,
        },
      );
    }

    // EMAIL VALIDATION

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address",
        },
        {
          status: 400,
        },
      );
    }

    // SUBJECT VALIDATION

    if (cleanSubject.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject must be at least 3 characters",
        },
        {
          status: 400,
        },
      );
    }

    if (cleanSubject.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject cannot exceed 150 characters",
        },
        {
          status: 400,
        },
      );
    }

    // MESSAGE VALIDATION

    if (cleanMessage.length < 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Message must be at least 5 characters",
        },
        {
          status: 400,
        },
      );
    }

    if (cleanMessage.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message cannot exceed 5000 characters",
        },
        {
          status: 400,
        },
      );
    }

    // ==================================================
    // CREATE CONTACT MESSAGE
    // ==================================================

    const contact = await Contact.create({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      status: "unread",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully",
        contact: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
          status: contact.status,
          createdAt: contact.createdAt,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create Contact API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send contact message",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// GET /api/contact
//
// Sirf ADMIN contact messages dekh sakta hai.
//
// Optional:
//
// /api/contact?status=unread
// /api/contact?status=read
// /api/contact?status=resolved
// ======================================================

export async function GET(request) {
  try {
    await connectDB();

    // ADMIN AUTHENTICATION

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        },
      );
    }

    const currentUser = auth.user;

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    // STATUS FILTER

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");

    const filter = {};

    if (status) {
      if (!["unread", "read", "resolved"].includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid contact message status",
          },
          {
            status: 400,
          },
        );
      }

      filter.status = status;
    }

    // ==================================================
    // GET CONTACT MESSAGES
    // ==================================================

    const contacts = await Contact.find(filter).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contact messages fetched successfully",
        contacts,
        count: contacts.length,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get Contact Messages API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch contact messages",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// PATCH /api/contact
//
// Admin message ka status change karega.
//
// Body:
//
// {
//   "id": "CONTACT_ID",
//   "status": "read"
// }
//
// OR
//
// {
//   "id": "CONTACT_ID",
//   "status": "resolved"
// }
// ======================================================

export async function PATCH(request) {
  try {
    await connectDB();

    // ADMIN AUTHENTICATION

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        },
      );
    }

    const currentUser = auth.user;

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    // REQUEST BODY

    const body = await request.json();

    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact message ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!["unread", "read", "resolved"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be unread, read or resolved",
        },
        {
          status: 400,
        },
      );
    }

    // FIND CONTACT MESSAGE

    const contact = await Contact.findById(id);

    if (!contact) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact message not found",
        },
        {
          status: 404,
        },
      );
    }

    // UPDATE STATUS

    contact.status = status;

    await contact.save();

    return NextResponse.json(
      {
        success: true,
        message: "Contact message status updated successfully",
        contact,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Update Contact API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid contact message ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update contact message",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// DELETE /api/contact
//
// Sirf ADMIN message delete kar sakta hai.
//
// Body:
//
// {
//   "id": "CONTACT_ID"
// }

export async function DELETE(request) {
  try {
    await connectDB();

    // ADMIN AUTHENTICATION

    const auth = await getAuthenticatedUser(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        },
      );
    }

    const currentUser = auth.user;

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    // REQUEST BODY

    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact message ID is required",
        },
        {
          status: 400,
        },
      );
    }

    // DELETE MESSAGE

    const deletedContact = await Contact.findByIdAndDelete(id);

    if (!deletedContact) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact message not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Contact message deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Delete Contact API Error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid contact message ID",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete contact message",
      },
      {
        status: 500,
      },
    );
  }
}
