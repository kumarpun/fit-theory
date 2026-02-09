import { Model } from "@/lib/model";

const productSchema = {
  name: {
    type: "VARCHAR(255)",
    required: true,
  },
  description: {
    type: "TEXT",
    default: null,
  },
  price: {
    type: "DECIMAL(10,2)",
    required: true,
  },
  images: {
    type: "TEXT",
    default: null,
  },
  category: {
    type: "VARCHAR(100)",
    default: null,
  },
  size: {
    type: "VARCHAR(255)",
    default: null,
  },
  stock: {
    type: "INT",
    default: 0,
  },
  isActive: {
    type: "BOOLEAN",
    default: true,
  },
};

const Product = new Model("products", productSchema);

export default Product;
