import { getConnection } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import OrderItem from "@/models/OrderItem";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    await Order.sync();
    const orders = await Order.findAll({ userId: user.id });

    return Response.json({ success: true, orders });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch orders", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    await Product.sync();
    await Order.sync();
    await OrderItem.sync();

    const { items, shippingName, shippingAddress, shippingCity, shippingState, shippingZip } =
      await request.json();

    if (!items || items.length === 0) {
      return Response.json(
        { success: false, message: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip) {
      return Response.json(
        { success: false, message: "All shipping fields are required" },
        { status: 400 }
      );
    }

    // Validate products and calculate total
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return Response.json(
          { success: false, message: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return Response.json(
          { success: false, message: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const lineTotal = Number(product.price) * item.quantity;
      total += lineTotal;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        currentStock: product.stock,
      });
    }

    // Use transaction for order creation
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (userId, status, total, shippingName, shippingAddress, shippingCity, shippingState, shippingZip)
         VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`,
        [user.id, total.toFixed(2), shippingName, shippingAddress, shippingCity, shippingState, shippingZip]
      );
      const orderId = orderResult.insertId;

      // Create order items and decrement stock
      for (const item of validatedItems) {
        await connection.execute(
          `INSERT INTO order_items (orderId, productId, quantity, price, size)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.price, item.size]
        );

        await connection.execute(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [item.quantity, item.productId]
        );
      }

      await connection.commit();

      return Response.json(
        { success: true, message: "Order placed successfully", orderId },
        { status: 201 }
      );
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to place order", error: error.message },
      { status: 500 }
    );
  }
}
