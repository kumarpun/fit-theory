"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUser, refreshTokens } from "@/lib/auth-client";
import { addToCart } from "@/lib/cart";
import Navbar from "@/app/components/Navbar";
import ImageLightbox from "@/app/components/ImageLightbox";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
          // Don't auto-select size — user must choose
        }
      } catch (err) {
        // Product will remain null
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [authLoading, params.id]);

  // Parse images from JSON string, fallback to imageUrl
  const getProductImages = () => {
    if (!product) return [];
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (product.imageUrl) return [product.imageUrl];
    return [];
  };

  const productImages = product ? getProductImages() : [];

  const handleAddToCart = () => {
    if (!product) return;
    const sizes = product.size
      ? product.size.split(",").map((s) => s.trim())
      : [];
    addToCart(product, sizes.length > 0 ? selectedSize : null, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Product not found.</p>
        </div>
      </div>
    );
  }

  const sizes = product.size
    ? product.size.split(",").map((s) => s.trim())
    : [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-800 mb-6 inline-block transition-colors"
        >
          &larr; Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {productImages.length > 0 ? (
              <>
                {/* Main image */}
                <img
                  src={productImages[mainImageIndex]}
                  alt={product.name}
                  onClick={() => setLightboxOpen(true)}
                  className="w-full rounded-lg shadow-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                />

                {/* Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    {productImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setMainImageIndex(index)}
                        className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                          mainImageIndex === index
                            ? "border-zinc-700"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-96 bg-zinc-100 rounded-lg flex items-center justify-center">
                <span className="text-zinc-400">No image</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-zinc-800 mb-2">
              {product.name}
            </h1>
            {product.category && (
              <p className="text-sm text-zinc-500 mb-4">{product.category}</p>
            )}
            <p className="text-3xl font-bold text-zinc-800 mb-6">
              ${Number(product.price).toFixed(2)}
            </p>

            {product.description && (
              <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Size
                </label>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "bg-zinc-700 text-white border-zinc-700"
                          : "bg-white text-zinc-800 border-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-zinc-300 rounded-md text-zinc-800 hover:bg-zinc-100 transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center text-zinc-800 font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 border border-zinc-300 rounded-md text-zinc-800 hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || (sizes.length > 0 && !selectedSize)}
              className="w-full px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock === 0
                ? "Out of Stock"
                : sizes.length > 0 && !selectedSize
                ? "Add to Cart"
                : added
                ? "Added to Cart!"
                : "Add to Cart"}
            </button>

            <p className="text-xs text-zinc-500 mt-3">
              {product.stock > 0
                ? `${product.stock} in stock`
                : "Currently unavailable"}
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && productImages.length > 0 && (
        <ImageLightbox
          images={productImages}
          initialIndex={mainImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
