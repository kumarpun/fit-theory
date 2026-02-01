import User from "@/models/User";

export async function GET() {
  try {
    await User.sync();

    return Response.json({
      success: true,
      message: "Users table created successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to create users table",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
