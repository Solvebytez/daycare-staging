"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isRedirectingRef = useRef(false);

  // Note: All users redirect to /search page after login
  // Dashboard URLs are no longer used for post-login redirects

  // Redirect if already logged in - check for redirect param or saved URL first
  // This only runs if we're NOT in the middle of a login redirect
  useEffect(() => {
    if (!authLoading && user && !isRedirectingRef.current) {
      // User is already logged in, check for redirect
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get("redirect");
      
      if (redirectParam) {
        const validatedUrl = validateRedirectUrl(redirectParam);
        if (validatedUrl) {
          isRedirectingRef.current = true;
          router.push(validatedUrl);
          return;
        }
      }
      
      // Check localStorage backup
      try {
        const savedSearchUrl = localStorage.getItem("searchRedirectUrl");
        if (savedSearchUrl) {
          const validatedUrl = validateRedirectUrl(savedSearchUrl);
          if (validatedUrl) {
            localStorage.removeItem("searchRedirectUrl");
            isRedirectingRef.current = true;
            router.push(validatedUrl);
            return;
          }
        }
      } catch {
        // Silent fail
      }
      
      // Default to search page
      isRedirectingRef.current = true;
      router.push("/search");
    }
  }, [user, authLoading, router]);

  // Validate redirect URL to ensure security (same origin, relative path)
  const validateRedirectUrl = (url: string): string | null => {
    try {
      // Decode the URL if it's encoded
      const decodedUrl = decodeURIComponent(url);
      
      // Only allow relative paths (starting with /)
      if (!decodedUrl.startsWith("/")) {
        return null;
      }
      
      // Prevent redirect to auth pages to avoid loops
      if (decodedUrl.startsWith("/login") || decodedUrl.startsWith("/register")) {
        return null;
      }
      
      // Try to construct a URL to validate it's safe
      const fullUrl = new URL(decodedUrl, window.location.origin);
      
      // Ensure it's same origin
      if (fullUrl.origin !== window.location.origin) {
        return null;
      }
      
      // Return the pathname + search (relative path)
      const result = fullUrl.pathname + fullUrl.search;
      return result;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Set flag to prevent useEffect from interfering
        isRedirectingRef.current = true;
        
        // Small delay to ensure login state is fully updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get redirect parameter from URL - read it multiple ways to be sure
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get("redirect");
        
        // Also try reading from window.location.search directly
        const currentSearch = window.location.search;
        const directRedirectMatch = currentSearch.match(/[?&]redirect=([^&]+)/);
        const directRedirectParam = directRedirectMatch ? decodeURIComponent(directRedirectMatch[1]) : null;
        
        // Use redirectParam or directRedirectParam
        const finalRedirectParam = redirectParam || directRedirectParam;
        
        // Validate and use redirect URL if provided
        let redirectUrl: string | null = null;
        
        if (finalRedirectParam) {
          redirectUrl = validateRedirectUrl(finalRedirectParam);
          if (redirectUrl) {
            // Clear localStorage backup since we're using redirect param
            try {
              localStorage.removeItem("searchRedirectUrl");
            } catch {
              // Silent fail
            }
          }
        }
        
        // Fallback 1: Check localStorage for saved search URL (check BEFORE clearing)
        if (!redirectUrl) {
          try {
            const savedSearchUrl = localStorage.getItem("searchRedirectUrl");
            if (savedSearchUrl) {
              redirectUrl = validateRedirectUrl(savedSearchUrl);
              if (redirectUrl) {
                // Only clear after successful validation and redirect
                // Don't clear yet - let the redirect happen first
              } else {
                localStorage.removeItem("searchRedirectUrl");
              }
            }
          } catch {
            // Silent fail
          }
        }
        
        // Fallback 2: Check if there are original search parameters to preserve
        if (!redirectUrl) {
        const originalParams = urlParams.get("params");
        if (originalParams) {
            redirectUrl = `/search?${originalParams}`;
        } else {
            redirectUrl = "/search";
          }
        }
        
        // Clear localStorage only after we've determined the redirect URL
        if (redirectUrl && redirectUrl !== "/search") {
          try {
            localStorage.removeItem("searchRedirectUrl");
          } catch {
            // Silent fail
          }
        }
        
        // Use window.location.href for a full page navigation to ensure URL is preserved
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      }
    } catch (error) {
      // Display the error message from the API or a generic message
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is logged in (will redirect via useEffect)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home Link */}
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your KinderBridge account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center text-gray-400 hover:text-gray-600 px-3"
                  style={{ minWidth: '48px', zIndex: 10, touchAction: 'manipulation' }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm text-center">{error}</p>
              {error.toLowerCase().includes("verify") && (
                <div className="mt-3 text-center">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(email)}`}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Resend verification email
                  </Link>
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up here
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-500">
                  Need Help?
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Having trouble signing in?{" "}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
