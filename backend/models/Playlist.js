import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
  {
    // Playlist kis user ki hai
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Playlist ka naam
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
      minlength: [1, "Playlist name cannot be empty"],
      maxlength: [50, "Playlist name cannot exceed 50 characters"],
    },

    // Playlist ki optional description
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },

    // Playlist mein videos ki list
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    // Default Watch Later playlist ki pehchan
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Playlist ki type
    type: {
      type: String,
      enum: ["custom", "watch-later"],
      default: "custom",
    },
  },
  {
    timestamps: true,
  },
);

// Ek user ki default Watch Later playlist sirf ek ho.
PlaylistSchema.index(
  { user: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "watch-later" },
  },
);

// Har user ki custom playlist ke naam unique hon.
PlaylistSchema.index(
  { user: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "custom" },
  },
);

const Playlist =
  mongoose.models.Playlist || mongoose.model("Playlist", PlaylistSchema);

export default Playlist;
