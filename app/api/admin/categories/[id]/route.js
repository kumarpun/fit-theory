import Category from "@/models/Category";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Category.sync();

    const existing = await Category.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return Response.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const duplicate = await Category.findOne({ name: name.trim() });
    if (duplicate && duplicate.id !== Number(id)) {
      return Response.json(
        { success: false, message: "Category name already exists" },
        { status: 400 }
      );
    }

    // Update products that reference the old category name
    await query("UPDATE products SET category = ? WHERE category = ?", [
      name.trim(),
      existing.name,
    ]);

    const category = await Category.update(id, { name: name.trim() });

    return Response.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update category", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Category.sync();

    const existing = await Category.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    await Category.delete(id);

    return Response.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to delete category", error: error.message },
      { status: 500 }
    );
  }
}
