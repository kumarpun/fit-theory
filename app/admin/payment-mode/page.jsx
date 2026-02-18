"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function PaymentModePage() {
  const [codEnabled, setCodEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) {
          setCodEnabled(data.settings.codEnabled !== "0");
        }
      } catch (err) {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async () => {
    const newValue = !codEnabled;
    setCodEnabled(newValue);
    try {
      await authFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codEnabled: newValue }),
      });
    } catch (err) {
      setCodEnabled(!newValue);
    }
  };

  if (loading) return <p className="text-zinc-500">Loading settings...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">Payment Mode</h1>

      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">Cash on Delivery</p>
            <p className="text-xs text-zinc-500 mt-0.5">Allow customers to pay cash on delivery</p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${codEnabled ? "bg-green-500" : "bg-zinc-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${codEnabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
