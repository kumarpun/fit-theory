import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Product.sync();
    const products = await Product.findAll();

    return Response.json({ success: true, products });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch products", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Product.sync();
    const { name, description, price, imageUrl, category, size, stock } =
      await request.json();

    if (!name || !price) {
      return Response.json(
        { success: false, message: "Name and price are required" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      description: description || null,
      price,
      imageUrl: imageUrl || null,
      category: category || null,
      size: size || null,
      stock: stock || 0,
      isActive: true,
    });

    return Response.json(
      { success: true, message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to create product", error: error.message },
      { status: 500 }
    );
  }
}
