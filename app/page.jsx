"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser, clearTokens, refreshTokens } from "@/lib/auth-client";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let currentUser = getUser();

      // Try to refresh tokens if user exists
      if (currentUser) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          currentUser = refreshed.user;
        } else {
          currentUser = null;
        }
      }

      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
          Fit Theory
        </h1>

        {user ? (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2">
              Welcome back, {user.name}!
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">
              {user.email}
            </p>

            <button
              onClick={handleLogout}
              className="px-8 py-3 border border-red-500 text-red-500 rounded-full font-medium hover:bg-red-500 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
              Your fitness journey starts here
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-8 py-3 border border-black dark:border-white text-black dark:text-white rounded-full font-medium hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
