"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, removeFromCart, updateCartItemQuantity, setCheckoutItems } from "@/lib/cart";
import { getUser } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import LoginModal from "@/app/components/LoginModal";

const itemKey = (item) => `${item.productId}-${item.size}-${item.color}`;

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const toggleSelect = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === cart.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(cart.map(itemKey)));
    }
  };

  const proceedToCheckout = () => {
    const selected = cart.filter((item) => selectedKeys.has(itemKey(item)));
    setCheckoutItems(selected);
    router.push("/checkout");
  };

  const handleCheckoutClick = () => {
    if (!getUser()) {
      setShowLoginModal(true);
      return;
    }
    proceedToCheckout();
  };

  useEffect(() => {
    const items = getCart().reverse();
    setCart(items);
    // Select the latest item (first after reverse) by default
    if (items.length > 0) {
      setSelectedKeys(new Set([itemKey(items[0])]));
    }

    fetch("/api/settings/delivery-charge")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDeliveryCharge(data.deliveryCharge);
      })
      .catch(() => {});

    const handleCartUpdate = () => {
      const updated = getCart().reverse();
      setCart(updated);
      setSelectedKeys((prev) => {
        const validKeys = new Set(updated.map(itemKey));
        const next = new Set();
        for (const key of prev) {
          if (validKeys.has(key)) next.add(key);
        }
        return next;
      });
    };
    window.addEventListener("cart-updated", handleCartUpdate);

    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  const selectedItems = cart.filter((item) => selectedKeys.has(itemKey(item)));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-zinc-800 mb-6">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-zinc-500 mb-4">Your cart is empty.</p>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-800 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Cart items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Select All */}
                <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={cart.length > 0 && selectedKeys.size === cart.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-zinc-700 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-zinc-600">
                    {selectedKeys.size === cart.length
                      ? "Deselect All"
                      : `Select All (${cart.length})`}
                  </span>
                  {selectedKeys.size > 0 && selectedKeys.size < cart.length && (
                    <span className="text-xs text-zinc-400">
                      ({selectedKeys.size} selected)
                    </span>
                  )}
                </div>

                {cart.map((item) => {
                  const key = itemKey(item);
                  const isSelected = selectedKeys.has(key);
                  return (
                    <div
                      key={key}
                      className={`p-4 border-t border-zinc-100 transition-opacity ${!isSelected ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(key)}
                          className="w-4 h-4 accent-zinc-700 cursor-pointer mt-1 flex-shrink-0"
                        />
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-zinc-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-zinc-400 text-xs">No img</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.productId}`}
                            className="text-sm font-semibold text-zinc-800 hover:underline block truncate"
                          >
                            {item.name}
                          </Link>
                          {item.color && (
                            <p className="text-xs text-zinc-500">Color: {item.color}</p>
                          )}
                          {item.size && (
                            <p className="text-xs text-zinc-500">Size: {item.size}</p>
                          )}
                          <p className="text-sm text-zinc-800 mt-0.5">
                            रु {item.price}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId, item.size, item.color)}
                          className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3 ml-[92px] sm:ml-[112px]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateCartItemQuantity(
                                item.productId,
                                item.size,
                                item.quantity - 1,
                                item.color
                              )
                            }
                            className="w-8 h-8 border border-zinc-300 rounded text-zinc-800 hover:bg-zinc-100 text-sm transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val === "") return;
                              const num = Math.max(1, Math.min(item.stock || Infinity, Number(val)));
                              updateCartItemQuantity(item.productId, item.size, num, item.color);
                            }}
                            className="w-10 text-center text-base text-zinc-800 border border-zinc-300 rounded py-1 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                          />
                          <button
                            onClick={() =>
                              updateCartItemQuantity(
                                item.productId,
                                item.size,
                                item.quantity + 1,
                                item.color
                              )
                            }
                            disabled={item.stock && item.quantity >= item.stock}
                            className="w-8 h-8 border border-zinc-300 rounded text-zinc-800 hover:bg-zinc-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-zinc-800">
                          रु {(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-5 lg:sticky lg:top-24">
                <h2 className="text-lg font-semibold text-zinc-800 mb-4">
                  Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""})
                </h2>
                <div className="space-y-3 mb-4">
                  {selectedItems.map((item) => (
                    <div key={itemKey(item)} className="flex justify-between text-sm">
                      <span className="text-zinc-600 truncate mr-2">{item.name} x{item.quantity}</span>
                      <span className="text-zinc-800 font-medium flex-shrink-0">रु {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Subtotal</span>
                    <span>रु {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Delivery Charge</span>
                    <span>रु {deliveryCharge}</span>
                  </div>
                  <p className="text-xs text-amber-600 font-medium">* Delivery charge varies based on city</p>
                </div>
                <div className="border-t border-zinc-200 mt-3 pt-4">
                  <div className="flex justify-between mb-4">
                    <p className="text-lg font-bold text-zinc-800">Total</p>
                    <p className="text-lg font-bold text-zinc-800">रु {subtotal + deliveryCharge}</p>
                  </div>
                  <button
                    onClick={handleCheckoutClick}
                    disabled={selectedKeys.size === 0}
                    className="w-full py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getUser() ? `Proceed to Checkout (${selectedKeys.size})` : "Login to Checkout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}
