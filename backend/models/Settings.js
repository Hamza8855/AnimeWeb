import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    channelName: {
      type: String,
      required: true,
      trim: true,
      default: "Anime Infinite Death",
      maxlength: 100,
    },

    channelDescription: {
      type: String,
      trim: true,
      default:
        "Anime rankings, stories, battles, characters and interesting anime content.",
      maxlength: 1000,
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },

    youtubeUrl: {
      type: String,
      trim: true,
      default: "https://www.youtube.com/@Animeinfinitydeath1234",
    },

    githubUrl: {
      type: String,
      trim: true,
      default: "https://github.com/",
    },

    linkedinUrl: {
      type: String,
      trim: true,
      default: "https://linkedin.com/",
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "contact@example.com",
    },
  },
  {
    timestamps: true,
  },
);

const Settings =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

export default Settings;
