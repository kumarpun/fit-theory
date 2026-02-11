"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearTokens, isAdmin } from "@/lib/auth-client";
import { getCartCount } from "@/lib/cart";

export default function Navbar({ transparent = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const isShopPage = pathname === "/shop";

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setSearchOpen(false);
    }
  };

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
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
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
        className={`text-base font-semibold transition-colors ${
          transparent
            ? active ? "text-white" : "text-white/70 hover:text-white"
            : active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav
      className={`z-50 ${
        transparent
          ? "absolute top-0 left-0 right-0 bg-transparent"
          : "bg-white border-b border-zinc-200 sticky top-0"
      }`}
      ref={searchRef}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className={`text-xl font-bold ${transparent ? "text-white" : "text-zinc-800"}`}>
          Fits Theory
        </Link>

        <div className="flex items-center gap-6">
          {!isShopPage && (
            <>
              {/* Mobile: search icon */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`sm:hidden transition-colors ${transparent ? "text-white/70 hover:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {/* Desktop: inline search */}
              <form onSubmit={handleSearch} className="hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-64 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                    transparent
                      ? "border-white/30 bg-white/10 text-white placeholder-white/50 focus:ring-white/40 focus:bg-white/20"
                      : "border-zinc-300 bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:ring-zinc-400 focus:bg-white"
                  }`}
                />
              </form>
            </>
          )}
          {navLink("/shop", "Shop")}
          <Link
            href="/cart"
            className={`text-base font-semibold transition-colors relative ${
              transparent
                ? pathname === "/cart" ? "text-white" : "text-white/70 hover:text-white"
                : pathname === "/cart" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
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

          <div className={`relative ml-2 pl-4 border-l ${transparent ? "border-white/30" : "border-zinc-200"}`} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1 text-base font-semibold transition-colors ${
                transparent ? "text-white/70 hover:text-white" : "text-zinc-600 hover:text-zinc-800"
              }`}
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

      {/* Mobile: full-width search bar */}
      {!isShopPage && searchOpen && (
        <div className={`sm:hidden px-4 py-3 ${transparent ? "border-t border-white/20" : "border-t border-zinc-200"}`}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                transparent
                  ? "border-white/30 bg-white/10 text-white placeholder-white/50 focus:ring-white/40"
                  : "border-zinc-300 bg-white text-zinc-800 focus:ring-zinc-400"
              }`}
            />
          </form>
        </div>
      )}
    </nav>
  );
}
