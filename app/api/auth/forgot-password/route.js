import crypto from "crypto";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request) {
  try {
    await User.sync();
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await User.update(user.id, {
        resetToken: hashedToken,
        resetTokenExpiry,
      });

      await sendPasswordResetEmail(email, resetToken);
    }

    // Same response whether user exists or not to prevent email enumeration
    return Response.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to process password reset request",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
