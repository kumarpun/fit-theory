import { OAuth2Client } from "google-auth-library";
import User from "@/models/User";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    await User.sync();
    const { credential } = await request.json();

    if (!credential) {
      return Response.json(
        { success: false, message: "Google credential is required" },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) {
      return Response.json(
        { success: false, message: "Google email not verified" },
        { status: 400 }
      );
    }

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (user) {
      // Existing user: link Google account if not already linked
      if (!user.googleId) {
        await User.update(user.id, { googleId });
        user.googleId = googleId;
      }

      // Check if account is disabled
      if (!user.isEnabled) {
        return Response.json(
          { success: false, message: "Account is disabled" },
          { status: 403 }
        );
      }
    } else {
      // New user: create account (no password for Google-only users)
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
      });
      // Fetch the full user record to get defaults (role, isEnabled, etc.)
      user = await User.findById(user.id);
    }

    // Generate our own JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return Response.json({
      success: true,
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Google authentication failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
