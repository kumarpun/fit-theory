"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><p className="text-zinc-500">Loading...</p></div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [categories, setCategories] = useState([]);
  const initialGender = searchParams.get("gender") || "";
  const [menOpen, setMenOpen] = useState(initialGender !== "Women");
  const [womenOpen, setWomenOpen] = useState(initialGender === "Women");

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

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.categories.map((c) => c.name));
      } catch (err) {}
    };
    fetchCategories();
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (gender) params.set("gender", gender);
        if (category) params.set("category", category);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        // Products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [authLoading, search, gender, category]);

  const handleGender = (g) => {
    setGender(g);
    setCategory("");
  };

  const handleCategory = (cat) => {
    setCategory(cat);
  };

  const handleAll = () => {
    setGender("");
    setCategory("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const sidebarBtn = (label, active, onClick) => (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-zinc-700 text-white font-medium"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {label}
    </button>
  );

  const pillBtn = (label, active, onClick) => (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-700 text-white"
          : "bg-white text-zinc-600 border border-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-800 mb-6">All Products</h1>

        {/* Mobile: horizontal pills */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-4 -mx-4 px-4">
          {pillBtn("All", !gender && !category, handleAll)}
          {pillBtn("Men", gender === "Men" && !category, () => handleGender("Men"))}
          {pillBtn("Women", gender === "Women" && !category, () => handleGender("Women"))}
          {categories.map((cat) => (
            <span key={cat}>
              {pillBtn(cat, category === cat, () => handleCategory(cat))}
            </span>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Desktop: left sidebar */}
          <aside className="hidden md:block w-48 flex-shrink-0">
            <nav className="space-y-1">
              {sidebarBtn("All", !gender && !category, handleAll)}

              {/* Men accordion */}
              <div className="pt-3">
                <button
                  onClick={() => setMenOpen(!menOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Men
                  <svg className={`w-4 h-4 transition-transform ${menOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menOpen && (
                  <div className="mt-1 space-y-0.5">
                    {sidebarBtn("All Men", gender === "Men" && !category, () => handleGender("Men"))}
                    {categories.map((cat) => (
                      <span key={`men-${cat}`}>
                        {sidebarBtn(cat, gender === "Men" && category === cat, () => { setGender("Men"); setCategory(cat); })}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Women accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setWomenOpen(!womenOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Women
                  <svg className={`w-4 h-4 transition-transform ${womenOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {womenOpen && (
                  <div className="mt-1 space-y-0.5">
                    {sidebarBtn("All Women", gender === "Women" && !category, () => handleGender("Women"))}
                    {categories.map((cat) => (
                      <span key={`women-${cat}`}>
                        {sidebarBtn(cat, gender === "Women" && category === cat, () => { setGender("Women"); setCategory(cat); })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </aside>

          {/* Right: search + products */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 text-base border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            {loading ? (
              <p className="text-zinc-500">Loading products...</p>
            ) : products.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-zinc-500">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  let firstImage = null;
                  if (product.images) {
                    try {
                      const parsed = JSON.parse(product.images);
                      if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                    } catch {}
                  }
                  if (!firstImage && product.imageUrl) firstImage = product.imageUrl;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group"
                    >
                      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.name}
                            className="w-full h-80 object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-80 bg-zinc-100 flex items-center justify-center">
                            <span className="text-zinc-400 text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="text-sm font-semibold text-zinc-800">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-xs text-zinc-500 mt-1">
                            {product.category}
                          </p>
                        )}
                        <p className="text-lg font-bold text-zinc-800 mt-1">
                          ${Number(product.price).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
