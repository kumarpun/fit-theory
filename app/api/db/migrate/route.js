import { query } from "@/lib/db";

export async function GET() {
  try {
    const results = [];

    // Migration 1: Add role column to users
    const roleColumns = await query("SHOW COLUMNS FROM users LIKE 'role'");
    if (roleColumns.length === 0) {
      await query(
        "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER password"
      );
      results.push("Added role column to users table");
    }

    // Migration 2: Add shippingPhone to orders + make state/zip nullable
    const phoneColumns = await query("SHOW COLUMNS FROM orders LIKE 'shippingPhone'");
    if (phoneColumns.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN shippingPhone VARCHAR(30) DEFAULT NULL AFTER shippingName"
      );
      results.push("Added shippingPhone column to orders table");
    }

    // Make shippingState and shippingZip nullable
    await query("ALTER TABLE orders MODIFY COLUMN shippingState VARCHAR(100) DEFAULT NULL");
    await query("ALTER TABLE orders MODIFY COLUMN shippingZip VARCHAR(20) DEFAULT NULL");
    results.push("Made shippingState and shippingZip nullable");

    // Migration 3: Add cancellationReason, returnReason columns + returned status
    const cancelReasonCols = await query("SHOW COLUMNS FROM orders LIKE 'cancellationReason'");
    if (cancelReasonCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN cancellationReason VARCHAR(500) DEFAULT NULL"
      );
      results.push("Added cancellationReason column to orders table");
    }

    const returnReasonCols = await query("SHOW COLUMNS FROM orders LIKE 'returnReason'");
    if (returnReasonCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN returnReason VARCHAR(500) DEFAULT NULL"
      );
      results.push("Added returnReason column to orders table");
    }

    // Add 'returned' to status ENUM
    await query(
      "ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending'"
    );
    results.push("Updated status ENUM to include returned");

    // Migration 4: Add paymentMethod and paymentScreenshot columns
    const paymentMethodCols = await query("SHOW COLUMNS FROM orders LIKE 'paymentMethod'");
    if (paymentMethodCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN paymentMethod ENUM('cod', 'online') DEFAULT 'cod'"
      );
      results.push("Added paymentMethod column to orders table");
    }

    const paymentScreenshotCols = await query("SHOW COLUMNS FROM orders LIKE 'paymentScreenshot'");
    if (paymentScreenshotCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN paymentScreenshot VARCHAR(500) DEFAULT NULL"
      );
      results.push("Added paymentScreenshot column to orders table");
    } else {
      // Migration 5: Change paymentScreenshot from LONGTEXT to VARCHAR(500) for URL storage
      await query(
        "ALTER TABLE orders MODIFY COLUMN paymentScreenshot VARCHAR(500) DEFAULT NULL"
      );
      results.push("Updated paymentScreenshot column to VARCHAR(500)");
    }

    return Response.json({
      success: true,
      message: results.length > 0 ? results.join("; ") : "All migrations already applied",
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
