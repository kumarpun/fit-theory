"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearTokens, isAdmin } from "@/lib/auth-client";
import { getCartCount } from "@/lib/cart";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const user = getUser();

  useEffect(() => {
    setCartCount(getCartCount());

    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  const handleLogout = () => {
    clearTokens();
    router.replace("/login");
  };

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-zinc-800">
          Fit Theory
        </Link>

        <div className="flex items-center gap-6">
          {navLink("/", "Shop")}
          <Link
            href="/cart"
            className={`text-sm font-medium transition-colors relative ${
              pathname === "/cart"
                ? "text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-zinc-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {navLink("/orders", "Orders")}
          {isAdmin() && navLink("/admin", "Admin")}

          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-zinc-200">
            <span className="text-sm text-zinc-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
