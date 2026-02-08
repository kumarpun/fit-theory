import { Model } from "@/lib/model";

const userSchema = {
  name: {
    type: "VARCHAR(255)",
    required: true,
  },
  email: {
    type: "VARCHAR(255)",
    required: true,
    unique: true,
  },
  password: {
    type: "VARCHAR(255)",
    required: true,
  },
  role: {
    type: "ENUM('user', 'admin')",
    default: "user",
  },
  isEnabled: {
    type: "BOOLEAN",
    default: true,
  },
  resetToken: {
    type: "VARCHAR(255)",
    default: null,
  },
  resetTokenExpiry: {
    type: "DATETIME",
    default: null,
  },
};

const User = new Model("users", userSchema);

export default User;
