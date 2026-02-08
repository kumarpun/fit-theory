"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/auth-client";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await authFetch(`/api/admin/orders/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          setItems(data.items);
          setStatus(data.order.status);
        }
      } catch (err) {
        // Order will remain null
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    setMessage("");

    try {
      const res = await authFetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (data.success) {
        setOrder({ ...order, status });
        setMessage("Status updated successfully");
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-zinc-500">Loading order...</p>;
  if (!order) return <p className="text-zinc-500">Order not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">
        Order #{order.id}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Order Info
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-zinc-500">Customer:</span>{" "}
              <span className="text-zinc-800">{order.userName}</span>
            </p>
            <p>
              <span className="text-zinc-500">Email:</span>{" "}
              <span className="text-zinc-800">{order.userEmail}</span>
            </p>
            <p>
              <span className="text-zinc-500">Date:</span>{" "}
              <span className="text-zinc-800">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </p>
            <p>
              <span className="text-zinc-500">Total:</span>{" "}
              <span className="text-zinc-800 font-semibold">
                ${Number(order.total).toFixed(2)}
              </span>
            </p>
            <p>
              <span className="text-zinc-500">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${
                  statusColors[order.status] || ""
                }`}
              >
                {order.status}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Shipping Address
          </h2>
          <div className="text-sm text-zinc-800 space-y-1">
            <p>{order.shippingName}</p>
            <p>{order.shippingAddress}</p>
            <p>
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">
          Update Status
        </h2>
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={updating}
            className="px-4 py-2 bg-zinc-700 text-white rounded-md text-sm font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update"}
          </button>
          {message && (
            <span className="text-sm text-green-700">{message}</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-lg font-semibold text-zinc-800 p-6 pb-0">
          Order Items
        </h2>
        <table className="w-full mt-4">
          <thead>
            <tr className="bg-zinc-100 text-zinc-700 text-sm font-medium">
              <th className="text-left px-6 py-3">Product</th>
              <th className="text-left px-6 py-3">Size</th>
              <th className="text-left px-6 py-3">Price</th>
              <th className="text-left px-6 py-3">Qty</th>
              <th className="text-right px-6 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="px-6 py-4 text-sm text-zinc-800">
                  {item.productName}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {item.size || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-800">
                  ${Number(item.price).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-800">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-800 text-right">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
