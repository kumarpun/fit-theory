import { Model } from "@/lib/model";

const orderSchema = {
  userId: {
    type: "INT",
    required: true,
  },
  status: {
    type: "ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')",
    default: "pending",
  },
  total: {
    type: "DECIMAL(10,2)",
    required: true,
  },
  shippingName: {
    type: "VARCHAR(255)",
    required: true,
  },
  shippingPhone: {
    type: "VARCHAR(30)",
    required: true,
  },
  shippingAddress: {
    type: "TEXT",
    required: true,
  },
  shippingCity: {
    type: "VARCHAR(100)",
    required: true,
  },
  shippingState: {
    type: "VARCHAR(100)",
  },
  shippingZip: {
    type: "VARCHAR(20)",
  },
  cancellationReason: {
    type: "VARCHAR(500)",
  },
  returnReason: {
    type: "VARCHAR(500)",
  },
  paymentMethod: {
    type: "ENUM('cod', 'online')",
    default: "cod",
  },
  paymentScreenshot: {
    type: "VARCHAR(500)",
  },
  deliveryCharge: {
    type: "DECIMAL(10,2)",
    default: 0,
  },
};

const Order = new Model("orders", orderSchema);

export default Order;
