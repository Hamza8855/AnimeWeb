import mongoose from "mongoose";

const savedVideoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: [true, "Video ID is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// A user can save the same video only once.
savedVideoSchema.index({ user: 1, video: 1 }, { unique: true });

const SavedVideo =
  mongoose.models.SavedVideo || mongoose.model("SavedVideo", savedVideoSchema);

export default SavedVideo;
