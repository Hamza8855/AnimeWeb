import mongoose from "mongoose";

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const getYouTubeIdFromUrl = (value) => {
  try {
    const url = new URL(value);

    const hostname = url.hostname.toLowerCase();
    const allowedHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
    ];

    if (!allowedHosts.includes(hostname)) {
      return null;
    }

    if (hostname.endsWith("youtube-nocookie.com")) {
      const match = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})\/?$/);
      return match ? match[1] : null;
    }

    if (hostname === "youtu.be" || hostname === "www.youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    const match = url.pathname.match(
      /^\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})\/?$/,
    );

    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      minlength: [2, "Video title must be at least 2 characters"],
      maxlength: [150, "Video title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    youtubeId: {
      type: String,
      required: [true, "YouTube video ID is required"],
      unique: true,
      trim: true,
      match: [YOUTUBE_ID_REGEX, "Invalid YouTube video ID format"],
    },

    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      trim: true,
      validate: {
        validator: function (value) {
          if (typeof value !== "string" || !value.trim()) {
            return false;
          }

          const extractedId = getYouTubeIdFromUrl(value.trim());

          return extractedId !== null && extractedId === this.youtubeId;
        },
        message: "YouTube URL must be valid and match the video ID",
      },
    },

    thumbnail: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2048, "Thumbnail URL is too long"],
      validate: {
        validator: function (value) {
          if (!value) return true;

          try {
            const url = new URL(value);

            return url.protocol === "https:" || url.protocol === "http:";
          } catch {
            return false;
          }
        },
        message: "Thumbnail must be a valid HTTP or HTTPS URL",
      },
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },

    likes: {
      type: Number,
      default: 0,
      min: [0, "Likes cannot be negative"],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

export default Video;
