import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // Registered user; null for guest comments.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Display name shown with the comment.
    authorName: {
      type: String,
      trim: true,
      default: "Guest",
      maxlength: [50, "Author name cannot exceed 50 characters"],
    },

    // Secure guest verification fields.
    guestId: {
      type: String,
      default: null,
      select: false,
    },

    guestClaimTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: [true, "Video is required"],
    },

    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    status: {
      type: String,
      enum: ["visible", "hidden", "deleted"],
      default: "visible",
    },
  },
  {
    timestamps: true,
  },
);

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
