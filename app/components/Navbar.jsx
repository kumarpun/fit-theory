"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearTokens, isAdmin } from "@/lib/auth-client";
import { getCartCount } from "@/lib/cart";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setUser(getUser());
    setAdmin(isAdmin());
    setCartCount(getCartCount());

    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearTokens();
    window.dispatchEvent(new Event("cart-updated"));
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
          {admin && navLink("/admin", "Admin")}

          <div className="relative ml-2 pl-4 border-l border-zinc-200" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-800 transition-colors"
            >
              {user?.name}
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Change Password
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
