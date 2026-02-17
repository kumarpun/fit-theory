"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authFetch } from "@/lib/auth-client";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    gender: "",
    isActive: true,
  });
  const [sizes, setSizes] = useState([{ size: "", stock: "", colors: [] }]);
  const [images, setImages] = useState([""]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          authFetch(`/api/admin/products/${params.id}`),
          authFetch("/api/admin/categories"),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (catData.success) setCategories(catData.categories);

        if (prodData.success) {
          setFormData({
            name: prodData.product.name || "",
            description: prodData.product.description || "",
            price: String(prodData.product.price),
            category: prodData.product.category || "",
            gender: prodData.product.gender || "",
            isActive: prodData.product.isActive,
          });

          // Parse sizes JSON (with nested colors)
          let parsedSizes = [];
          if (prodData.product.sizes) {
            try {
              parsedSizes = JSON.parse(prodData.product.sizes);
            } catch {}
          }
          if (parsedSizes.length === 0) {
            if (prodData.product.size) {
              const sizeList = prodData.product.size.split(",").map((s) => s.trim()).filter(Boolean);
              parsedSizes = sizeList.map((s, i) => ({
                size: s,
                stock: i === 0 ? prodData.product.stock || 0 : 0,
                colors: [],
              }));
            } else {
              parsedSizes = [{ size: "", stock: prodData.product.stock || 0, colors: [] }];
            }
          }
          setSizes(
            parsedSizes.map((s) => ({
              size: s.size || "",
              stock: String(s.stock ?? 0),
              colors: Array.isArray(s.colors)
                ? s.colors.map((c) => ({ color: c.color || "", stock: String(c.stock ?? 0) }))
                : [],
            }))
          );

          // Parse images
          let parsedImages = [];
          if (prodData.product.images) {
            try {
              parsedImages = JSON.parse(prodData.product.images);
            } catch {}
          }
          if (parsedImages.length === 0 && prodData.product.imageUrl) {
            parsedImages = [prodData.product.imageUrl];
          }
          setImages(parsedImages.length > 0 ? parsedImages : [""]);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageChange = (index, value) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const addImageField = () => {
    if (images.length < 4) setImages([...images, ""]);
  };

  const removeImageField = (index) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    } else {
      setImages([""]);
    }
  };

  const setCoverImage = (index) => {
    if (index === 0) return;
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setImages(updated);
  };

  const handleSizeChange = (index, field, value) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    setSizes(updated);
  };

  const addSizeRow = () => {
    setSizes([...sizes, { size: "", stock: "", colors: [] }]);
  };

  const removeSizeRow = (index) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter((_, i) => i !== index));
    } else {
      setSizes([{ size: "", stock: "", colors: [] }]);
    }
  };

  const handleSizeColorChange = (sizeIndex, colorIndex, field, value) => {
    const updated = [...sizes];
    const updatedColors = [...updated[sizeIndex].colors];
    updatedColors[colorIndex] = { ...updatedColors[colorIndex], [field]: value };
    updated[sizeIndex] = { ...updated[sizeIndex], colors: updatedColors };
    setSizes(updated);
  };

  const addSizeColorRow = (sizeIndex) => {
    const updated = [...sizes];
    updated[sizeIndex] = {
      ...updated[sizeIndex],
      colors: [...updated[sizeIndex].colors, { color: "", stock: "" }],
    };
    setSizes(updated);
  };

  const removeSizeColorRow = (sizeIndex, colorIndex) => {
    const updated = [...sizes];
    updated[sizeIndex] = {
      ...updated[sizeIndex],
      colors: updated[sizeIndex].colors.filter((_, i) => i !== colorIndex),
    };
    setSizes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const filteredImages = images.filter((url) => url.trim() !== "");

      const processedSizes = sizes.map((s) => {
        const colors = s.colors
          .filter((c) => c.color.trim() !== "")
          .map((c) => ({ color: c.color, stock: Number(c.stock) || 0 }));
        const stock = colors.length > 0
          ? colors.reduce((sum, c) => sum + c.stock, 0)
          : Number(s.stock) || 0;
        return { size: s.size, stock, colors };
      });

      const res = await authFetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images: filteredImages,
          sizes: processedSizes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/products");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <p className="text-zinc-500">Loading product...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">Edit Product</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-8 rounded-lg shadow-md"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-zinc-700">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-2 text-zinc-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-2 text-zinc-700">
              Price *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2 text-zinc-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-2 text-zinc-700">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="">Select gender</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-zinc-700">
              Images (up to 4)
            </label>
            {images.some((url) => url.trim()) && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            )}
          </div>
          {images.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder={`Image URL ${index + 1}`}
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <button
                type="button"
                onClick={() => removeImageField(index)}
                className="px-3 py-2 text-red-500 hover:text-red-700 text-sm transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <button
              type="button"
              onClick={addImageField}
              className="text-sm text-zinc-600 hover:text-zinc-800 font-medium transition-colors"
            >
              + Add another image
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-zinc-700">
            Sizes, Colors & Stock
          </label>
          {sizes.map((entry, index) => (
            <div key={index} className="mb-3 border border-zinc-200 rounded-md p-3">
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={entry.size}
                  onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                  placeholder="Size (e.g. M, L, XL)"
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                {entry.colors.length === 0 && (
                  <input
                    type="number"
                    value={entry.stock}
                    onChange={(e) => handleSizeChange(index, "stock", e.target.value)}
                    placeholder="Stock"
                    min="0"
                    className="w-24 px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeSizeRow(index)}
                  className="px-3 py-2 text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>

              {entry.colors.length > 0 && (
                <div className="ml-4 space-y-2">
                  {entry.colors.map((c, ci) => (
                    <div key={ci} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={c.color}
                        onChange={(e) => handleSizeColorChange(index, ci, "color", e.target.value)}
                        placeholder="Color (e.g. Red)"
                        className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      />
                      <input
                        type="number"
                        value={c.stock}
                        onChange={(e) => handleSizeColorChange(index, ci, "stock", e.target.value)}
                        placeholder="Stock"
                        min="0"
                        className="w-20 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeSizeColorRow(index, ci)}
                        className="px-2 py-1 text-red-500 hover:text-red-700 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => addSizeColorRow(index)}
                className="ml-4 mt-1 text-xs text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
              >
                + Add color to this size
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSizeRow}
            className="text-sm text-zinc-600 hover:text-zinc-800 font-medium transition-colors"
          >
            + Add size
          </button>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-zinc-700">Active</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-md font-medium hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Image Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-800">Image Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {images.filter((url) => url.trim()).map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className={`w-full aspect-square object-cover rounded-lg border-2 ${index === 0 ? "border-zinc-700" : "border-zinc-200"}`}
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-zinc-700 text-white text-xs px-2 py-0.5 rounded">Cover</span>
                  )}
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => { setCoverImage(index); }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <span className="bg-white text-zinc-800 text-xs font-medium px-3 py-1.5 rounded-md shadow">Set as Cover</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
