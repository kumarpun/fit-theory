// Client-side cart utilities (localStorage)

const CART_KEY = "fit-theory-cart";

export function getCart() {
  if (typeof window === "undefined") return [];
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, size = null, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(
    (item) => item.productId === product.id && item.size === size
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      size,
      quantity,
    });
  }

  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function removeFromCart(productId, size = null) {
  const cart = getCart().filter(
    (item) => !(item.productId === productId && item.size === size)
  );
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function updateCartItemQuantity(productId, size, quantity) {
  const cart = getCart();
  const item = cart.find(
    (item) => item.productId === productId && item.size === size
  );
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}
