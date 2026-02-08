import { query } from "@/lib/db";

export async function GET() {
  try {
    // Check if role column already exists
    const columns = await query("SHOW COLUMNS FROM users LIKE 'role'");

    if (columns.length === 0) {
      await query(
        "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER password"
      );
      return Response.json({
        success: true,
        message: "Role column added to users table",
      });
    }

    return Response.json({
      success: true,
      message: "Role column already exists",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Migration failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
