import { query, getConnection } from "@/lib/db";
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

export async function PUT(request, { params }) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const order = await Order.findById(id);

    if (!order || order.userId !== user.id) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "delivered") {
      return Response.json(
        { success: false, message: "Returns can only be requested for delivered orders" },
        { status: 400 }
      );
    }

    const { returnReason } = await request.json();

    if (!returnReason || !returnReason.trim()) {
      return Response.json(
        { success: false, message: "Return reason is required" },
        { status: 400 }
      );
    }

    await Order.update(id, { status: "returned", returnReason });

    return Response.json({ success: true, message: "Return request submitted" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to submit return request", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const order = await Order.findById(id);

    if (!order || order.userId !== user.id) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return Response.json(
        { success: false, message: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    // Restore stock and delete order in a transaction
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const items = await query(
        "SELECT productId, quantity FROM order_items WHERE orderId = ?",
        [id]
      );

      for (const item of items) {
        await connection.execute(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.productId]
        );
      }

      await connection.execute("DELETE FROM order_items WHERE orderId = ?", [id]);
      await connection.execute("DELETE FROM orders WHERE id = ?", [id]);

      await connection.commit();

      return Response.json({ success: true, message: "Order cancelled and deleted" });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to cancel order", error: error.message },
      { status: 500 }
    );
  }
}
