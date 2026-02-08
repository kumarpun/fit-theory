import { query } from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const orders = await query(
      `SELECT orders.*, users.name as userName, users.email as userEmail
       FROM orders
       JOIN users ON orders.userId = users.id
       WHERE orders.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const items = await query(
      `SELECT order_items.*, products.name as productName, products.imageUrl
       FROM order_items
       JOIN products ON order_items.productId = products.id
       WHERE order_items.orderId = ?`,
      [id]
    );

    return Response.json({ success: true, order: orders[0], items });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch order", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return Response.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const existing = await Order.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const order = await Order.update(id, { status });

    return Response.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update order", error: error.message },
      { status: 500 }
    );
  }
}
