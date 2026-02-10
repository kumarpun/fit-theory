import { getConnection } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import OrderItem from "@/models/OrderItem";
import Setting from "@/models/Setting";
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

    const { items, shippingName, shippingPhone, shippingAddress, shippingCity, shippingState, shippingZip, paymentMethod, paymentScreenshot } =
      await request.json();

    if (!items || items.length === 0) {
      return Response.json(
        { success: false, message: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity) {
      return Response.json(
        { success: false, message: "Name, phone, address, and city are required" },
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

      // Per-size stock validation
      let sizesArr = [];
      if (product.sizes) {
        try { sizesArr = JSON.parse(product.sizes); } catch {}
      }

      const sizeKey = item.size || "";
      if (sizesArr.length > 0) {
        const sizeEntry = sizesArr.find((s) => s.size === sizeKey);
        const sizeStock = sizeEntry ? Number(sizeEntry.stock) || 0 : 0;
        if (sizeStock < item.quantity) {
          return Response.json(
            { success: false, message: `Insufficient stock for ${product.name}${item.size ? ` (size ${item.size})` : ""}` },
            { status: 400 }
          );
        }
      } else {
        if (product.stock < item.quantity) {
          return Response.json(
            { success: false, message: `Insufficient stock for ${product.name}` },
            { status: 400 }
          );
        }
      }

      const lineTotal = Number(product.price) * item.quantity;
      total += lineTotal;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        sizesArr,
      });
    }

    // Fetch delivery charge
    const deliveryChargeSetting = await Setting.findOne({ settingKey: "deliveryCharge" });
    const deliveryCharge = deliveryChargeSetting ? Number(deliveryChargeSetting.value) : 0;
    const grandTotal = total + deliveryCharge;

    // Use transaction for order creation
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (userId, status, total, deliveryCharge, shippingName, shippingPhone, shippingAddress, shippingCity, shippingState, shippingZip, paymentMethod, paymentScreenshot)
         VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, grandTotal.toFixed(2), deliveryCharge.toFixed(2), shippingName, shippingPhone, shippingAddress, shippingCity, shippingState || null, shippingZip || null, paymentMethod || "cod", paymentMethod === "online" ? paymentScreenshot : null]
      );
      const orderId = orderResult.insertId;

      // Create order items and decrement per-size stock
      for (const item of validatedItems) {
        await connection.execute(
          `INSERT INTO order_items (orderId, productId, quantity, price, size)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.price, item.size]
        );

        // Re-read product with lock for safe stock update
        const [rows] = await connection.execute(
          `SELECT sizes, stock FROM products WHERE id = ? FOR UPDATE`,
          [item.productId]
        );
        const current = rows[0];
        let updatedSizes = [];
        if (current.sizes) {
          try { updatedSizes = JSON.parse(current.sizes); } catch {}
        }

        const sizeKey = item.size || "";
        if (updatedSizes.length > 0) {
          updatedSizes = updatedSizes.map((s) =>
            s.size === sizeKey ? { ...s, stock: Math.max(0, (Number(s.stock) || 0) - item.quantity) } : s
          );
          const newTotal = updatedSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
          await connection.execute(
            `UPDATE products SET sizes = ?, stock = ? WHERE id = ?`,
            [JSON.stringify(updatedSizes), newTotal, item.productId]
          );
        } else {
          await connection.execute(
            `UPDATE products SET stock = stock - ? WHERE id = ?`,
            [item.quantity, item.productId]
          );
        }
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
