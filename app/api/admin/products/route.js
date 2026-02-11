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
    const { name, description, price, images, category, gender, sizes } =
      await request.json();

    if (!name || !price) {
      return Response.json(
        { success: false, message: "Name and price are required" },
        { status: 400 }
      );
    }

    const sizesArr = Array.isArray(sizes) && sizes.length > 0 ? sizes : [{ size: "", stock: 0, colors: [] }];
    const totalStock = sizesArr.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    const sizeStr = sizesArr.map((s) => s.size).filter(Boolean).join(", ");

    // Collect all unique color names from nested colors
    const allColors = new Set();
    sizesArr.forEach((s) => {
      if (Array.isArray(s.colors)) {
        s.colors.forEach((c) => { if (c.color) allColors.add(c.color); });
      }
    });

    const product = await Product.create({
      name,
      description: description || null,
      price,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      category: category || null,
      gender: gender || null,
      color: allColors.size > 0 ? [...allColors].join(", ") : null,
      size: sizeStr || null,
      stock: totalStock,
      sizes: JSON.stringify(sizesArr),
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
