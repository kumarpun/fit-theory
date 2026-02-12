"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens } from "@/lib/auth-client";
import { getCart, removeFromCart, updateCartItemQuantity, getCartTotal } from "@/lib/cart";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

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
    setCart(getCart());

    const handleCartUpdate = () => setCart(getCart());
    window.addEventListener("cart-updated", handleCartUpdate);

    const fetchDeliveryCharge = async () => {
      try {
        const res = await fetch("/api/settings/delivery-charge");
        const data = await res.json();
        if (data.success) setDeliveryCharge(data.deliveryCharge);
      } catch (err) {}
    };
    fetchDeliveryCharge();

    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [authLoading]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal + (cart.length > 0 ? deliveryCharge : 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
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
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {cart.map((item, i) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className={`p-4 ${i > 0 ? "border-t border-zinc-100" : ""}`}
                >
                  {/* Top row: image + info + remove (desktop: price too) */}
                  <div className="flex items-start gap-3 sm:gap-4">
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
                        रु {item.price.toFixed(2)}
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

                  {/* Bottom row: quantity + line total */}
                  <div className="flex items-center justify-between mt-3 ml-[76px] sm:ml-[96px]">
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
                      रु {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Subtotal</span>
                  <span>रु {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Delivery Charge</span>
                  <span>रु {deliveryCharge.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-lg font-bold text-zinc-800">
                  Total: रु {grandTotal.toFixed(2)}
                </p>
                <Link
                  href="/checkout"
                  className="px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors text-center"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
