"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUser, refreshTokens, authFetch } from "@/lib/auth-client";
import { getCheckoutItems, clearCheckoutItems, removeItemsFromCart } from "@/lib/cart";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [defaultCharge, setDefaultCharge] = useState(0);
  const [codEnabled, setCodEnabled] = useState(true);
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const items = getCheckoutItems();
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }
    setCart(items);

    const fetchData = async () => {
      try {
        const [chargeRes, citiesRes, profileRes] = await Promise.all([
          fetch("/api/settings/delivery-charge"),
          fetch("/api/cities"),
          authFetch("/api/profile"),
        ]);
        const chargeData = await chargeRes.json();
        const citiesData = await citiesRes.json();
        const profileData = await profileRes.json();
        if (chargeData.success) {
          setDefaultCharge(chargeData.deliveryCharge);
          setDeliveryCharge(chargeData.deliveryCharge);
          if (chargeData.codEnabled === false) {
            setCodEnabled(false);
            setPaymentMethod("online");
          }
        }
        if (citiesData.success) setCities(citiesData.cities);

        if (profileData.success && profileData.profile) {
          const p = profileData.profile;
          if (p.phone || p.address || p.city) {
            setShipping({
              name: p.name || "",
              phone: p.phone || "",
              address: p.address || "",
              city: p.city || "",
              state: p.state || "",
              zip: p.zip || "",
            });
            if (p.city) {
              setCitySearch(p.city);
              if (citiesData.success) {
                const selectedCity = citiesData.cities.find((c) => c.name === p.city);
                if (selectedCity) {
                  setDeliveryCharge(Number(selectedCity.deliveryCharge));
                }
              }
            }
          }
        }
      } catch (err) {}
    };
    fetchData();
  }, [authLoading, router]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal + deliveryCharge;
  const minAdvance = Math.ceil(subtotal * 0.3);

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setShipping({ ...shipping, city: cityName });
    const selectedCity = cities.find((c) => c.name === cityName);
    setDeliveryCharge(selectedCity ? Number(selectedCity.deliveryCharge) : defaultCharge);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result);
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);

    if (paymentMethod === "online" && !paymentScreenshot) {
      setToast("Please upload your payment screenshot.");
      setTimeout(() => setToast(""), 3000);
      setPlacing(false);
      return;
    }

    try {
      let screenshotUrl = null;
      if (paymentMethod === "online" && paymentScreenshot) {
        const uploadRes = await authFetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: paymentScreenshot }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          setError(uploadData.message || "Failed to upload screenshot");
          setPlacing(false);
          return;
        }
        screenshotUrl = uploadData.url;
      }

      const res = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state || null,
          shippingZip: shipping.zip || null,
          paymentMethod,
          paymentScreenshot: screenshotUrl,
          deliveryCharge,
          paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        removeItemsFromCart(cart);
        clearCheckoutItems();
        router.push(`/orders/${data.orderId}`);
      } else {
        setError(data.message || "Failed to place order");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in">
          {toast}
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/cart")}
            className="text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-zinc-800">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">
              Shipping Address
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-zinc-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={shipping.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium mb-2 text-zinc-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shipping.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium mb-2 text-zinc-700">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={shipping.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="mb-4 relative" ref={cityRef}>
              <label htmlFor="city" className="block text-sm font-medium mb-2 text-zinc-700">
                City *
              </label>
              {cities.length > 0 ? (
                <>
                  <input
                    type="text"
                    id="city"
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCitySearch(val);
                      setShowCityDropdown(true);
                      const match = cities.find((c) => c.name.toLowerCase() === val.toLowerCase());
                      if (match) {
                        setShipping({ ...shipping, city: match.name });
                        setDeliveryCharge(Number(match.deliveryCharge));
                      } else {
                        setShipping({ ...shipping, city: val });
                        setDeliveryCharge(defaultCharge);
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    autoComplete="off"
                    required
                    className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                  {showCityDropdown && (() => {
                    const filtered = cities.filter((c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase())
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filtered.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => {
                              setCitySearch(city.name);
                              setShipping({ ...shipping, city: city.name });
                              setDeliveryCharge(Number(city.deliveryCharge));
                              setShowCityDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 ${
                              shipping.city === city.name ? "bg-zinc-50 font-medium text-zinc-800" : "text-zinc-700"
                            }`}
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shipping.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-2 text-zinc-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={shipping.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm font-medium mb-2 text-zinc-700">
                  ZIP
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={shipping.zip}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-zinc-800 mb-4">
              Payment Method
            </h2>

            <div className="flex gap-4 mb-4">
              {codEnabled && (
                <label className={`flex-1 flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-zinc-700 bg-zinc-50" : "border-zinc-300"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-zinc-700"
                  />
                  <span className="text-sm font-medium text-zinc-800">Cash on Delivery</span>
                </label>
              )}
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors ${paymentMethod === "online" ? "border-zinc-700 bg-zinc-50" : "border-zinc-300"}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-zinc-700"
                />
                <span className="text-sm font-medium text-zinc-800">Online Payment</span>
              </label>
            </div>

            {paymentMethod === "online" && (
              <div className="mb-6">
                <div className="mb-4 p-4 bg-zinc-50 border border-zinc-200 rounded-md">
                  <p className="text-sm text-zinc-600 mb-3">Scan the QR code below to make payment:</p>
                  <img
                    src="/qqr.jpg"
                    alt="Payment QR Code"
                    className="w-48 h-48 mx-auto object-contain border border-zinc-200 rounded-md"
                  />
                </div>
                <label className="block text-sm font-medium mb-2 text-zinc-700">
                  Upload Payment Screenshot *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
                {screenshotPreview && (
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot preview"
                    className="mt-3 w-full max-h-48 object-contain border border-zinc-200 rounded-md"
                  />
                )}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="paidAmount" className="block text-sm font-medium mb-2 text-zinc-700">
                Amount You Are Paying (रु)
              </label>
              <input
                type="number"
                id="paidAmount"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={`Min रु ${minAdvance} (30% advance)`}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              {paidAmount && Number(paidAmount) > 0 && (
                <p className="mt-1 text-xs text-zinc-500">
                  Remaining balance: रु {Math.max(0, grandTotal - Number(paidAmount))}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={placing}
              className="w-full px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
            >
              {placing ? "Placing Order..." : "Place Order"}
            </button>
          </form>

          <div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <p className="text-zinc-800">{item.name}</p>
                      <p className="text-zinc-500 text-xs">
                        Qty: {item.quantity}
                        {item.color ? ` · Color: ${item.color}` : ""}
                        {item.size ? ` · Size: ${item.size}` : ""}
                      </p>
                    </div>
                    <p className="text-zinc-800 font-medium">
                      रु {(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-200 mt-4 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-zinc-800">रु {subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Delivery Charge</span>
                  <span className="text-zinc-800">रु {deliveryCharge}</span>
                </div>
              </div>
              <div className="border-t border-zinc-200 mt-3 pt-4 flex justify-between">
                <p className="text-lg font-bold text-zinc-800">Total</p>
                <p className="text-lg font-bold text-zinc-800">
                  रु {grandTotal}
                </p>
              </div>

              {/* Pre-order advance banner */}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Pre-Order:</span> You need to pay at least <span className="font-semibold">रु {minAdvance}</span> (30% of product price) to confirm your pre-order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
