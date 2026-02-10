"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const heroImages = ["/home.jpg", "/aa.jpg"];

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [textVisible, setTextVisible] = useState(true);

  const changeSlide = useCallback((next) => {
    setTextVisible(false);
    setTimeout(() => {
      setCurrentSlide(next);
      setTimeout(() => setTextVisible(true), 400);
    }, 300);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      changeSlide((currentSlide + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide, changeSlide]);

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
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products.slice(0, 3));
        }
      } catch (err) {
        // Products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar transparent />
      {/* Hero Carousel */}
      <div className="relative h-[90vh] overflow-hidden">
        {heroImages.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`Fit Theory ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Dot indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => changeSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentSlide === index ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        <div className={`absolute bottom-35 left-6 sm:left-40 transition-opacity duration-300 ${textVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-white text-[28px] sm:text-[56px] font-semibold mb-4 leading-tight">
            Enchanting styles for<br />every individuals
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-white text-zinc-800 font-semibold rounded-md hover:bg-zinc-100 transition-colors"
          >
            Shop now &rarr;
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-zinc-800 mb-6">New Arrivals</h2>

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
      <Footer />
    </div>
  );
}
