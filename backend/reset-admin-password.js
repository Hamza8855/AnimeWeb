import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import "dotenv/config";

const rl = readline.createInterface({ input, output });

async function resetAdminPassword() {
  try {
    const email = (await rl.question("Admin email: ")).trim().toLowerCase();

    const newPassword = await rl.question(
      "Enter new password (minimum 8 characters): ",
    );

    if (!email || newPassword.length < 8) {
      throw new Error("Valid email and password (8+ characters) are required.");
    }

    const mongoUri =
      process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MongoDB URI not found. Check your backend .env file.");
    }

    await mongoose.connect(mongoUri);

    // Update only the existing admin account.
    const User =
      mongoose.models.User ||
      mongoose.model(
        "User",
        new mongoose.Schema(
          {
            email: String,
            password: String,
            role: String,
            isBlocked: Boolean,
          },
          { collection: "users" },
        ),
      );

    const admin = await User.findOne({
      email,
      role: "admin",
    });

    if (!admin) {
      throw new Error("No admin account found with that email.");
    }

    if (admin.isBlocked) {
      throw new Error("This admin account is blocked. Password unchanged.");
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    console.log("Admin password reset successfully.");
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    rl.close();
  }
}

resetAdminPassword();
