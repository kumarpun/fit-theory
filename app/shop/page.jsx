"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const ITEMS_PER_PAGE = 9;
  const initialGender = searchParams.get("gender") || "";
  const [menOpen, setMenOpen] = useState(initialGender !== "Women");
  const [womenOpen, setWomenOpen] = useState(initialGender === "Women");
  const [mobileMenOpen, setMobileMenOpen] = useState(false);
  const [mobileWomenOpen, setMobileWomenOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.categories.map((c) => c.name));
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (gender) params.set("gender", gender);
        if (category) params.set("category", category);
        if (priceRange) params.set("priceRange", priceRange);
        params.set("page", page);
        params.set("limit", ITEMS_PER_PAGE);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setTotalProducts(data.total);
        }
      } catch (err) {
        // Products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, gender, category, priceRange, page]);

  const handleGender = (g) => {
    setGender(g);
    setCategory("");
    setPriceRange("");
    setPage(1);
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    setPriceRange("");
    setPage(1);
  };

  const handleAll = () => {
    setGender("");
    setCategory("");
    setPriceRange("");
    setPage(1);
  };

  const handlePriceRange = (range) => {
    setPriceRange(range);
    setGender("");
    setCategory("");
    setPage(1);
  };

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
        <div className="md:hidden flex gap-2 flex-wrap pb-4 mb-4">
          {pillBtn("All", !gender && !category && !priceRange, handleAll)}
          {pillBtn("Affordable", priceRange === "affordable", () => handlePriceRange("affordable"))}
          {pillBtn("Premium", priceRange === "premium", () => handlePriceRange("premium"))}

          {/* Men dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setMobileMenOpen(!mobileMenOpen); setMobileWomenOpen(false); }}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                gender === "Men"
                  ? "bg-zinc-700 text-white"
                  : "bg-white text-zinc-600 border border-zinc-300"
              }`}
            >
              Men
              <svg className={`w-3 h-3 transition-transform ${mobileMenOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileMenOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                <button onClick={() => { handleGender("Men"); setMobileMenOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${gender === "Men" && !category ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600 hover:bg-zinc-50"}`}>All Men</button>
                {categories.map((cat) => (
                  <button key={`mob-men-${cat}`} onClick={() => { setGender("Men"); setCategory(cat); setPriceRange(""); setPage(1); setMobileMenOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${gender === "Men" && category === cat ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600 hover:bg-zinc-50"}`}>{cat}</button>
                ))}
              </div>
            )}
          </div>

          {/* Women dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setMobileWomenOpen(!mobileWomenOpen); setMobileMenOpen(false); }}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                gender === "Women"
                  ? "bg-zinc-700 text-white"
                  : "bg-white text-zinc-600 border border-zinc-300"
              }`}
            >
              Women
              <svg className={`w-3 h-3 transition-transform ${mobileWomenOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileWomenOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                <button onClick={() => { handleGender("Women"); setMobileWomenOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${gender === "Women" && !category ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600 hover:bg-zinc-50"}`}>All Women</button>
                {categories.map((cat) => (
                  <button key={`mob-women-${cat}`} onClick={() => { setGender("Women"); setCategory(cat); setPriceRange(""); setPage(1); setMobileWomenOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${gender === "Women" && category === cat ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600 hover:bg-zinc-50"}`}>{cat}</button>
                ))}
              </div>
            )}
          </div>
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
                        {sidebarBtn(cat, gender === "Men" && category === cat, () => { setGender("Men"); setCategory(cat); setPriceRange(""); setPage(1); })}
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
                        {sidebarBtn(cat, gender === "Women" && category === cat, () => { setGender("Women"); setCategory(cat); setPriceRange(""); setPage(1); })}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price range */}
              <div className="pt-3 border-t border-zinc-200 mt-3">
                <p className="px-3 py-2 text-sm font-semibold text-zinc-700">Price Range</p>
                <div className="space-y-0.5">
                  {sidebarBtn("Affordable", priceRange === "affordable", () => handlePriceRange("affordable"))}
                  {sidebarBtn("Premium", priceRange === "premium", () => handlePriceRange("premium"))}
                </div>
              </div>
            </nav>
          </aside>

          {/* Right: search + products */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 px-4 py-2 text-base border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="">Sort by</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {loading ? (
              <p className="text-zinc-500">Loading products...</p>
            ) : (() => {
              const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
              return products.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-zinc-500">No products found.</p>
                </div>
              ) : (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...products].sort((a, b) => {
                  if (sortBy === "price-low") return Number(a.price) - Number(b.price);
                  if (sortBy === "price-high") return Number(b.price) - Number(a.price);
                  return 0;
                }).map((product) => {
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
                          रु {Number(product.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm text-zinc-800 border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-zinc-400 text-sm">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={`px-3 py-1.5 text-sm border rounded-md ${
                            page === p
                              ? "bg-zinc-700 text-white border-zinc-700"
                              : "border-zinc-300 text-zinc-800 hover:bg-zinc-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm text-zinc-800 border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
              </>
              );
            })()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
