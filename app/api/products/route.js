import { query } from "@/lib/db";
import Product from "@/models/Product";

export async function GET(request) {
  try {
    await Product.sync();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const gender = searchParams.get("gender");
    const search = searchParams.get("search");

    let sql = "SELECT * FROM products WHERE isActive = true";
    const params = [];

    if (gender) {
      sql += " AND gender = ?";
      params.push(gender);
    }

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY created_at DESC";

    const products = await query(sql, params);

    return Response.json({ success: true, products });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch products", error: error.message },
      { status: 500 }
    );
  }
}
