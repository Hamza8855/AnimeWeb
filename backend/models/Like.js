import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: [true, "Video is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Same user same video ko sirf ek baar like kar sake
likeSchema.index(
  {
    user: 1,
    video: 1,
  },
  {
    unique: true,
  },
);

const Like = mongoose.models.Like || mongoose.model("Like", likeSchema);

export default Like;
