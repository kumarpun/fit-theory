"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens, authFetch } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      let currentUser = getUser();
      if (currentUser) {
        const refreshed = await refreshTokens();
        if (!refreshed) currentUser = null;
      }
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setAuthLoading(false);
    };
    initAuth();
  }, [router]);

  useEffect(() => {
    if (authLoading) return;

    const fetchOrder = async () => {
      try {
        const res = await authFetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          setItems(data.items);
        }
      } catch (err) {
        // Order will remain null
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [authLoading, params.id]);

  const handleReturn = async () => {
    if (!returnReason.trim()) return;
    setSubmittingReturn(true);
    try {
      const res = await authFetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnReason }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, status: "returned", returnReason });
        setShowReturnForm(false);
        setReturnReason("");
      } else {
        alert(data.message || "Failed to submit return request");
      }
    } catch (err) {
      alert("Failed to submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const res = await authFetch(`/api/orders/${params.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/orders");
      } else {
        alert(data.message || "Failed to cancel order");
      }
    } catch (err) {
      alert("Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/orders"
          className="text-sm text-zinc-500 hover:text-zinc-800 mb-6 inline-block transition-colors"
        >
          &larr; Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-800">
            Order #{order.id}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                statusColors[order.status] || ""
              }`}
            >
              {order.status}
            </span>
            {order.status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
            {order.status === "delivered" && !showReturnForm && (
              <button
                onClick={() => setShowReturnForm(true)}
                className="px-4 py-2 border border-orange-500 text-orange-500 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors"
              >
                Request Return
              </button>
            )}
          </div>
        </div>

        {showReturnForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">
              Return Request
            </h2>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
              placeholder="Describe the reason for return (e.g. defective product, wrong item)..."
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReturn}
                disabled={submittingReturn || !returnReason.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {submittingReturn ? "Submitting..." : "Submit Return"}
              </button>
              <button
                onClick={() => { setShowReturnForm(false); setReturnReason(""); }}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {order.cancellationReason && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
            <h2 className="text-sm font-semibold text-red-800 mb-2">
              Cancellation Reason
            </h2>
            <p className="text-sm text-red-700">{order.cancellationReason}</p>
          </div>
        )}

        {order.returnReason && (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg mb-6">
            <h2 className="text-sm font-semibold text-orange-800 mb-2">
              Return Reason
            </h2>
            <p className="text-sm text-orange-700">{order.returnReason}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">
              Order Info
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-zinc-500">Date:</span>{" "}
                <span className="text-zinc-800">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </p>
              {Number(order.deliveryCharge || 0) > 0 && (
                <>
                  <p>
                    <span className="text-zinc-500">Subtotal:</span>{" "}
                    <span className="text-zinc-800">
                      ${(Number(order.total) - Number(order.deliveryCharge)).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Delivery:</span>{" "}
                    <span className="text-zinc-800">
                      ${Number(order.deliveryCharge).toFixed(2)}
                    </span>
                  </p>
                </>
              )}
              <p>
                <span className="text-zinc-500">Total:</span>{" "}
                <span className="text-zinc-800 font-semibold">
                  ${Number(order.total).toFixed(2)}
                </span>
              </p>
              <p>
                <span className="text-zinc-500">Payment:</span>{" "}
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${order.paymentMethod === "online" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-700"}`}>
                  {order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">
              Shipping Address
            </h2>
            <div className="text-sm text-zinc-800 space-y-1">
              <p>{order.shippingName}</p>
              <p className="text-zinc-500">{order.shippingPhone}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ""}{order.shippingZip ? ` ${order.shippingZip}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-sm font-semibold text-zinc-800 p-6 pb-0">
            Items
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
      <Footer />
    </div>
  );
}
