"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState("");

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

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(search ? data.products : data.products.slice(0, 3));
        }
      } catch (err) {
        // Products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [authLoading, search]);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-zinc-800 flex-shrink-0">Shop</h1>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-m px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <Link
            href="/shop"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-800 transition-colors flex-shrink-0"
          >
            View All &rarr;
          </Link>
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
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={product.name}
                      className="w-full h-48 object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-48 bg-zinc-100 flex items-center justify-center">
                      <span className="text-zinc-400 text-sm">No image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-zinc-800 mb-1">
                      {product.name}
                    </h3>
                    {product.category && (
                      <p className="text-xs text-zinc-500 mb-2">
                        {product.category}
                      </p>
                    )}
                    <p className="text-lg font-bold text-zinc-800">
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
  );
}
