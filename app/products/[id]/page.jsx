"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens } from "@/lib/auth-client";
import { addToCart, getStockForSize } from "@/lib/cart";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ImageLightbox from "@/app/components/ImageLightbox";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

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

          // Fetch related products from same category
          if (data.product.category) {
            try {
              const relRes = await fetch(`/api/products?category=${encodeURIComponent(data.product.category)}`);
              const relData = await relRes.json();
              if (relData.success) {
                setRelatedProducts(
                  relData.products
                    .filter((p) => p.id !== data.product.id)
                    .slice(0, 4)
                );
              }
            } catch {}
          }
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

  // Parse sizes JSON for per-size stock
  const getSizesArray = () => {
    if (!product) return [];
    if (product.sizes) {
      try {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    // Fallback from legacy size + stock
    if (product.size) {
      return product.size.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ size: s, stock: Number(product.stock) || 0 }));
    }
    return [];
  };

  const sizesArray = product ? getSizesArray() : [];
  const hasSizes = sizesArray.length > 0 && sizesArray.some((s) => s.size !== "");

  // Get colors for the currently selected size
  const selectedSizeEntry = sizesArray.find((s) => s.size === selectedSize);
  const sizeColorsArray = selectedSizeEntry && Array.isArray(selectedSizeEntry.colors)
    ? selectedSizeEntry.colors.filter((c) => c.color !== "")
    : [];
  const hasSizeColors = sizeColorsArray.length > 0;

  const selectedStock = hasSizes
    ? hasSizeColors
      ? (sizeColorsArray.find((c) => c.color === selectedColor)?.stock ?? 0)
      : (selectedSizeEntry?.stock ?? 0)
    : getStockForSize(product, null);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, hasSizes ? selectedSize : null, quantity, hasSizeColors ? selectedColor : null);
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

  const totalStock = sizesArray.length > 0
    ? sizesArray.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
    : Number(product.stock) || 0;

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
              रु {Number(product.price).toFixed(2)}
            </p>

            {product.description && (
              <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {hasSizes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizesArray.filter((s) => s.size !== "").map((s) => {
                    const sizeStock = Number(s.stock) || 0;
                    const isOut = sizeStock === 0;
                    return (
                      <button
                        key={s.size}
                        onClick={() => {
                          setSelectedSize(s.size);
                          setSelectedColor("");
                          setQuantity(1);
                        }}
                        disabled={isOut}
                        className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                          selectedSize === s.size
                            ? "bg-zinc-700 text-white border-zinc-700"
                            : isOut
                            ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed line-through"
                            : "bg-white text-zinc-800 border-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasSizeColors && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizeColorsArray.map((c) => {
                    const colorStock = Number(c.stock) || 0;
                    const isOut = colorStock === 0;
                    return (
                      <button
                        key={c.color}
                        onClick={() => {
                          setSelectedColor(c.color);
                          setQuantity(1);
                        }}
                        disabled={isOut}
                        className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                          selectedColor === c.color
                            ? "bg-zinc-700 text-white border-zinc-700"
                            : isOut
                            ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed line-through"
                            : "bg-white text-zinc-800 border-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {c.color}
                      </button>
                    );
                  })}
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
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val === "") return setQuantity(1);
                    const num = Math.max(1, Math.min(selectedStock, Number(val)));
                    setQuantity(num);
                  }}
                  className="w-12 text-center text-zinc-800 font-medium border border-zinc-300 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <button
                  onClick={() => setQuantity(Math.min(selectedStock, quantity + 1))}
                  disabled={quantity >= selectedStock}
                  className="w-10 h-10 border border-zinc-300 rounded-md text-zinc-800 hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={selectedStock === 0 || (hasSizes && !selectedSize) || (hasSizeColors && !selectedColor)}
              className="w-full px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {totalStock === 0
                ? "Out of Stock"
                : hasSizes && !selectedSize
                ? "Select a Size"
                : hasSizeColors && !selectedColor
                ? "Select a Color"
                : selectedStock === 0
                ? "Out of Stock"
                : added
                ? "Added to Cart!"
                : "Add to Cart"}
            </button>

            <p className="text-xs text-zinc-500 mt-3">
              {hasSizeColors && selectedColor
                ? `${selectedStock} in stock for ${selectedSize} / ${selectedColor}`
                : hasSizes && selectedSize
                ? `${selectedStock} in stock for size ${selectedSize}`
                : totalStock > 0
                ? `${totalStock} total in stock`
                : "Currently unavailable"}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8 border-t border-zinc-200 mt-8">
          <h2 className="text-xl font-bold text-zinc-800 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => {
              let firstImage = null;
              if (rp.images) {
                try {
                  const parsed = JSON.parse(rp.images);
                  if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                } catch {}
              }
              if (!firstImage && rp.imageUrl) firstImage = rp.imageUrl;

              return (
                <Link
                  key={rp.id}
                  href={`/products/${rp.id}`}
                  className="group"
                >
                  <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={rp.name}
                        className="w-full h-70 object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-70 bg-zinc-100 flex items-center justify-center">
                        <span className="text-zinc-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-zinc-800">{rp.name}</h3>
                    <p className="text-lg font-bold text-zinc-800 mt-1">
                      रु {Number(rp.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && productImages.length > 0 && (
        <ImageLightbox
          images={productImages}
          initialIndex={mainImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      <Footer />
    </div>
  );
}
