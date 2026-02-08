import { query } from "@/lib/db";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const order = await Order.findById(id);

    if (!order) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
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

    return Response.json({ success: true, order, items });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch order", error: error.message },
      { status: 500 }
    );
  }
}
