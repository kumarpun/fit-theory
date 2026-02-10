"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function AdminSettingsPage() {
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) {
          setDeliveryCharge(data.settings.deliveryCharge || "0");
        }
      } catch (err) {
        // keep default
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await authFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCharge: parseFloat(deliveryCharge) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Settings saved successfully");
      } else {
        setMessage(data.message || "Failed to save settings");
      }
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-zinc-500">Loading settings...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="deliveryCharge" className="block text-sm font-medium mb-2 text-zinc-700">
            Delivery Charge ($)
          </label>
          <input
            type="number"
            id="deliveryCharge"
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(e.target.value)}
            min="0"
            step="0.01"
            required
            className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Set to 0 for free delivery. This charge will be added to all new orders.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
