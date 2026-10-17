import mongoose from "mongoose";

// CONTACT SCHEMA

const contactSchema = new mongoose.Schema(
  {
    // Person ka naam

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // Person ka email

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    // Message ka subject

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters"],
      maxlength: [150, "Subject cannot exceed 150 characters"],
    },

    // Actual contact message

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    // Admin message status

    status: {
      type: String,
      enum: ["unread", "read", "resolved"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  },
);

// MODEL

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;
