"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const heroImages = ["/home.jpg", "/aa.jpg"];

function ProductCard({ product }) {
  let firstImage = null;
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
    } catch {}
  }
  if (!firstImage && product.imageUrl) firstImage = product.imageUrl;

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.name}
            className="w-full h-84 object-cover object-top"
          />
        ) : (
          <div className="w-full h-84 bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-400 text-sm">No image</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-zinc-800">{product.name}</h3>
        <p className="text-lg font-bold text-zinc-800 mt-1">
          रु {Number(product.price).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const router = useRouter();
  const [menProducts, setMenProducts] = useState([]);
  const [womenProducts, setWomenProducts] = useState([]);
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
          const men = data.products.filter((p) => p.gender === "Men");
          const women = data.products.filter((p) => p.gender === "Women");
          setMenProducts(men.slice(0, 3));
          setWomenProducts(women.slice(0, 3));
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
        {loading ? (
          <p className="text-zinc-500">Loading products...</p>
        ) : (
          <>
            {/* Men Section */}
            {menProducts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-zinc-800">Men</h2>
                  <Link href="/shop?gender=Men" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
                    View all &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Women Section */}
            {womenProducts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-zinc-800">Women</h2>
                  <Link href="/shop?gender=Women" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
                    View all &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {womenProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {menProducts.length === 0 && womenProducts.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-zinc-500">No products found.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
