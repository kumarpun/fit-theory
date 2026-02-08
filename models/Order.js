import { Model } from "@/lib/model";

const orderSchema = {
  userId: {
    type: "INT",
    required: true,
  },
  status: {
    type: "ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')",
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
    required: true,
  },
  shippingZip: {
    type: "VARCHAR(20)",
    required: true,
  },
};

const Order = new Model("orders", orderSchema);

export default Order;
