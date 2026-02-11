// Client-side cart utilities (localStorage)

function getCartKey() {
  if (typeof window === "undefined") return "fit-theory-cart-guest";
  try {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed?.id) return `fit-theory-cart-${parsed.id}`;
    }
  } catch {}
  return "fit-theory-cart-guest";
}

export function getCart() {
  if (typeof window === "undefined") return [];
  const cart = localStorage.getItem(getCartKey());
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

export function getStockForSize(product, size) {
  if (!product) return 0;
  let sizesArr = [];
  if (product.sizes) {
    try {
      sizesArr = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
    } catch {}
  }
  if (Array.isArray(sizesArr) && sizesArr.length > 0) {
    const entry = sizesArr.find((s) => s.size === (size || ""));
    return entry ? Number(entry.stock) || 0 : 0;
  }
  return Number(product.stock) || 0;
}

export function getStockForSizeColor(product, size, color) {
  if (!product) return 0;
  let sizesArr = [];
  if (product.sizes) {
    try {
      sizesArr = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
    } catch {}
  }
  if (Array.isArray(sizesArr) && sizesArr.length > 0) {
    const sizeEntry = sizesArr.find((s) => s.size === (size || ""));
    if (!sizeEntry) return 0;
    if (color && Array.isArray(sizeEntry.colors) && sizeEntry.colors.length > 0) {
      const colorEntry = sizeEntry.colors.find((c) => c.color === color);
      return colorEntry ? Number(colorEntry.stock) || 0 : 0;
    }
    return Number(sizeEntry.stock) || 0;
  }
  return Number(product.stock) || 0;
}

export function addToCart(product, size = null, quantity = 1, color = null) {
  const cart = getCart();
  const existing = cart.find(
    (item) => item.productId === product.id && item.size === size && item.color === color
  );

  const stock = size ? getStockForSizeColor(product, size, color) : Number(product.stock) || 0;

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, stock);
    existing.stock = stock;
  } else {
    // Get first image from images JSON array, fallback to imageUrl
    let imageUrl = product.imageUrl || null;
    if (product.images) {
      try {
        const parsed = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
      } catch {}
    }

    cart.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl,
      size,
      color,
      quantity: Math.min(quantity, stock),
      stock,
    });
  }

  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function removeFromCart(productId, size = null, color = null) {
  const cart = getCart().filter(
    (item) => !(item.productId === productId && item.size === size && item.color === color)
  );
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function updateCartItemQuantity(productId, size, quantity, color = null) {
  const cart = getCart();
  const item = cart.find(
    (item) => item.productId === productId && item.size === size && item.color === color
  );
  if (item) {
    item.quantity = Math.max(1, Math.min(quantity, item.stock || Infinity));
    saveCart(cart);
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function clearCart() {
  localStorage.removeItem(getCartKey());
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().length;
}
