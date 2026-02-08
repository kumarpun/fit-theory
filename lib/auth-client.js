// Client-side auth utilities

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function setTokens(accessToken, refreshToken, user) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
}

export function isAdmin() {
  const user = getUser();
  return user?.role === "admin";
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export async function refreshTokens() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (data.success) {
      setTokens(data.accessToken, data.refreshToken, data.user);
      return data;
    } else {
      clearTokens();
      return null;
    }
  } catch (error) {
    clearTokens();
    return null;
  }
}

// Fetch with auto token refresh
export async function authFetch(url, options = {}) {
  let accessToken = getAccessToken();

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let res = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh token
  if (res.status === 401) {
    const refreshed = await refreshTokens();

    if (refreshed) {
      // Retry with new token
      headers.Authorization = `Bearer ${refreshed.accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}
