import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Enhanced throttling and caching for middleware
interface RefreshResponse {
  success: boolean;
  data?: {
    user?: {
      _id?: string;
      id?: string;
      email?: string;
      userType?: string;
      [key: string]: unknown;
    };
    accessToken?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const lastRefreshTime = new Map<string, number>();
const tokenCache = new Map<
  string,
  { data: RefreshResponse; expires: number }
>();
const REFRESH_THROTTLE_MS = 30000; // 30 seconds (increased to prevent loops)
const TOKEN_CACHE_MS = 60000; // 60 seconds cache (increased)
const MAX_CACHE_SIZE = 100;

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/search",
  "/daycare",
  "/classes",
  "/toys",
  "/api",
];

// Protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/favorites",
  "/parent",
  "/provider",
  "/employer",
  "/apply",
  "/payment",
  "/purchase-report",
];

// Auth routes (login, register)
const authRoutes = ["/login", "/register"];

/**
 * Same backend as the browser (api.ts). Vercel is always NODE_ENV=production;
 * we must not force api.kinderbridge.ca when staging uses Render (NEXT_PUBLIC_API_URL).
 */
function getApiBaseUrl(): string {
  const PRODUCTION_FALLBACK = "https://api.kinderbridge.ca";
  const envUrl =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "")) ||
    "";
  if (envUrl) return envUrl;
  if (process.env.NODE_ENV === "production") return PRODUCTION_FALLBACK;
  return "http://localhost:5001";
}

/** Path + query for post-login redirect; strip Next.js internal params */
function redirectPathPreservingQuery(request: NextRequest): string {
  const u = request.nextUrl.clone();
  u.searchParams.delete("_rsc");
  return u.pathname + u.search;
}

/**
 * Handle role-based redirects based on user type
 */
function handleUserTypeRedirect(
  userType: string,
  pathname: string,
  request: NextRequest
): NextResponse {
  // Check route permissions based on user type
  if (userType === "parent") {
    // Parent can access parent routes
    const parentRoutes = [
      "/parent",
      "/favorites",
      "/profile",
      "/search",
      "/payment",
      "/purchase-report",
    ];
    if (!parentRoutes.some((route) => pathname.startsWith(route))) {
      console.log(`🚫 Access denied: PARENT cannot access ${pathname}`);
      const redirectUrl = new URL("/parent/dashboard", request.url);
      // Preserve query parameters from original request
      request.nextUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });
      return NextResponse.redirect(redirectUrl);
    }
    console.log("✅ PARENT access granted");
  } else if (userType === "provider") {
    // Provider can access provider routes
    const providerRoutes = ["/provider", "/profile", "/search"];
    if (!providerRoutes.some((route) => pathname.startsWith(route))) {
      console.log(`🚫 Access denied: PROVIDER cannot access ${pathname}`);
      const redirectUrl = new URL("/provider/dashboard", request.url);
      // Preserve query parameters from original request
      request.nextUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });
      return NextResponse.redirect(redirectUrl);
    }
    console.log("✅ PROVIDER access granted");
  } else if (userType === "employer" || userType === "employee") {
    // Employer/Employee can access employer routes
    const employerRoutes = ["/employer", "/profile", "/dashboard"];
    if (!employerRoutes.some((route) => pathname.startsWith(route))) {
      console.log(
        `🚫 Access denied: ${userType.toUpperCase()} cannot access ${pathname}`
      );
      const redirectUrl = new URL("/dashboard", request.url);
      // Preserve query parameters from original request
      request.nextUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });
      return NextResponse.redirect(redirectUrl);
    }
    console.log(`✅ ${userType.toUpperCase()} access granted`);
  }

  return NextResponse.next();
}

// Helper function to refresh token when accessToken is missing but refreshToken exists
async function refreshTokenIfNeeded(
  refreshToken: string | undefined,
  accessToken: string | undefined,
  request: NextRequest
): Promise<NextResponse | null> {
  // Only refresh if refreshToken exists but accessToken is missing
  if (!refreshToken || accessToken) {
    return null;
  }

  const now = Date.now();
  const cacheKey = refreshToken;
  const cachedData = tokenCache.get(cacheKey);

  // Check if we have valid cached data
  if (cachedData && cachedData.expires > now) {
    const userType = cachedData.data?.data?.user?.userType;
    const userEmail = cachedData.data?.data?.user?.email;
    if (userType && userEmail) {
      console.log("✅ Using cached token data for refresh");
      // Forward cookies from cache if available
      NextResponse.next();
      // Note: We can't forward cookies from cache, so we'll refresh anyway
      // But we can skip if cache is very recent
      const cacheAge = now - (cachedData.expires - TOKEN_CACHE_MS);
      if (cacheAge < 5000) {
        // Cache is less than 5 seconds old, skip refresh
        return null;
      }
    }
  }

  // Throttle refresh calls
  const lastRefresh = lastRefreshTime.get(refreshToken) ?? 0;
  const timeSinceLastRefresh = now - lastRefresh;

  if (timeSinceLastRefresh < REFRESH_THROTTLE_MS) {
    console.log("⏱️ Refresh throttled, skipping proactive refresh");
    return null;
  }

  try {
    console.log("🔄 Proactively refreshing missing accessToken...");

    const apiUrl = getApiBaseUrl();
    
    // Forward all cookies from the incoming request to the backend
    const cookieHeader = request.headers.get("cookie") || "";
    
    const refreshResponse = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader, // Forward all cookies from the request
      },
      credentials: "include",
    });

    if (!refreshResponse.ok) {
      console.log("❌ Proactive token refresh failed:", refreshResponse.status);
      return null; // Don't block request, just log
    }

    console.log("✅ Proactive token refresh successful");

    const refreshData: RefreshResponse = await refreshResponse.json();
    const userId = refreshData.data?.user?._id || refreshData.data?.user?.id;
    const stableCacheKey = userId || refreshToken;

    // Cache the response
    tokenCache.set(stableCacheKey, {
      data: refreshData,
      expires: now + TOKEN_CACHE_MS,
    });

    // Clean up old cache entries
    if (tokenCache.size > MAX_CACHE_SIZE) {
      const firstKey = tokenCache.keys().next().value;
      if (firstKey) tokenCache.delete(firstKey);
    }

    // Forward cookies from backend
    const response = NextResponse.next();
    const setCookieHeader = refreshResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    lastRefreshTime.set(refreshToken, Date.now());
    return response;
  } catch (error) {
    console.error("💥 Proactive refresh error:", error);
    return null; // Don't block request on error
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("refreshToken")?.value;
  const accessToken = request.cookies.get("accessToken")?.value;

  /**
   * Localhost dev against a remote API:
   * - Auth cookies are stored on the API domain (e.g. onrender.com / api.kinderbridge.ca)
   * - Next.js middleware runs on the frontend domain (localhost) and cannot read API-domain cookies
   * Result: infinite redirect loop to /login even though API requests are authenticated.
   *
   * So when on localhost and NEXT_PUBLIC_API_URL points to a non-localhost HTTPS API,
   * we skip route protection in middleware and let client-side auth handle it.
   */
  const host = request.nextUrl.hostname;
  const apiUrlForMiddleware = getApiBaseUrl();
  const isLocalhostFrontend =
    host === "localhost" || host === "127.0.0.1" || host === "::1";
  const isRemoteHttpsApi =
    apiUrlForMiddleware.startsWith("https://") &&
    !apiUrlForMiddleware.includes("localhost") &&
    !apiUrlForMiddleware.includes("127.0.0.1");
  const skipMiddlewareAuthForRemoteApi = isLocalhostFrontend && isRemoteHttpsApi;

  console.log("🔍 Middleware Debug:");
  console.log("  pathname:", pathname);
  console.log("  accessToken:", accessToken ? "✅ Present" : "❌ Missing");
  console.log("  refreshToken:", refreshToken ? "✅ Present" : "❌ Missing");
  if (skipMiddlewareAuthForRemoteApi) {
    console.log(
      "🧪 Localhost + remote API detected: skipping middleware auth redirects"
    );
  }

  // Proactively refresh token if refreshToken exists but accessToken is missing
  // This ensures accessToken is always available when refreshToken is valid
  const refreshResponse = await refreshTokenIfNeeded(
    refreshToken,
    accessToken,
    request
  );
  if (refreshResponse) {
    return refreshResponse;
  }

  // 1. Handle protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    console.log("🛡️ Protected route detected, checking authentication...");

    if (skipMiddlewareAuthForRemoteApi) {
      return NextResponse.next();
    }

    if (!refreshToken) {
      console.log("❌ No refresh token found, redirecting to login");
      // Build redirect URL with original pathname and query params
      const redirectUrl = new URL("/login", request.url);
      const originalUrl = redirectPathPreservingQuery(request);
      redirectUrl.searchParams.set("redirect", originalUrl);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      response.headers.set("x-clear-auth", "true");
      return response;
    }

    try {
      // Check cache first
      const cacheKey = refreshToken;
      let cachedData = tokenCache.get(cacheKey);
      const now = Date.now();

      // If not found by refreshToken, try to find by any cache entry (fallback)
      if (!cachedData || cachedData.expires <= now) {
        // Try to find valid cache entry by checking all entries
        for (const [, value] of tokenCache.entries()) {
          if (value.expires > now && value.data?.data?.user?.userType) {
            cachedData = value;
            break;
          }
        }
      }

      if (cachedData && cachedData.expires > now) {
        console.log("✅ Using cached token data");
        const userType = cachedData.data?.data?.user?.userType;
        const userEmail = cachedData.data?.data?.user?.email;

        // Proceed with cached data only if we have valid user data
        if (userType && userEmail) {
          return handleUserTypeRedirect(userType, pathname, request);
        } else {
          console.log("❌ Invalid cached data, will refresh token instead");
          // Clear invalid cache and continue to refresh
          tokenCache.delete(cacheKey);
        }
      }

      // Throttle refresh calls to prevent excessive requests
      const lastRefresh = refreshToken
        ? lastRefreshTime.get(refreshToken) ?? 0
        : 0;
      const timeSinceLastRefresh = now - lastRefresh;

      if (timeSinceLastRefresh < REFRESH_THROTTLE_MS) {
        console.log("⏱️ Refresh throttled, using cached data or skipping...");
        if (cachedData) {
          const userType = cachedData.data?.data?.user?.userType;
          const userEmail = cachedData.data?.data?.user?.email;
          if (userType && userEmail) {
            return handleUserTypeRedirect(userType, pathname, request);
          }
          console.log(
            "❌ Invalid throttled cached data; clearing cache and attempting refresh"
          );
          tokenCache.delete(cacheKey);
        } else {
          console.log(
            "⏱️ No cached data during throttle window; attempting refresh (avoids false logout on concurrent navigations)"
          );
        }
      }

      console.log("🔄 Attempting to refresh token and get user info...");

      // Refresh the token and get user info in one call
      const apiUrl = getApiBaseUrl();
      
      // Forward all cookies from the incoming request to the backend
      const cookieHeader = request.headers.get("cookie") || "";
      
      const refreshResponse = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader, // Forward all cookies from the request
        },
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        console.log("❌ Token refresh failed:", refreshResponse.status);
        throw new Error("Token refresh failed");
      }

      console.log("✅ Token refresh successful");

      // Get user data from refresh response
      const refreshData = await refreshResponse.json();

      // Extract user ID for stable cache key
      const userId = refreshData.data?.user?._id || refreshData.data?.user?.id;
      const userType = refreshData.data?.user?.userType;
      const userEmail = refreshData.data?.user?.email;

      // Use user ID as cache key instead of refreshToken (more stable)
      const stableCacheKey = userId || refreshToken;

      // Create response with cookies from backend
      const response = NextResponse.next();

      // Forward cookies from backend to browser (accessToken and CSRF token)
      // Backend handles all cookie attributes (httpOnly, secure, sameSite, etc.)
      // We just forward the Set-Cookie header as-is
      const setCookieHeader = refreshResponse.headers.get("set-cookie");
      if (setCookieHeader) {
        console.log("🍪 Setting cookies from backend:", setCookieHeader);
        response.headers.set("set-cookie", setCookieHeader);
      }

      // Cache the response data with stable key
      if (tokenCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = tokenCache.keys().next().value;
        if (firstKey) {
          tokenCache.delete(firstKey);
        }
      }
      tokenCache.set(stableCacheKey, {
        data: refreshData,
        expires: now + TOKEN_CACHE_MS,
      });

      // Also update cache with refreshToken key for backward compatibility
      if (refreshToken && refreshToken !== stableCacheKey) {
        tokenCache.set(refreshToken, {
          data: refreshData,
          expires: now + TOKEN_CACHE_MS,
        });
      }

      lastRefreshTime.set(refreshToken, Date.now());

      console.log("👤 User type from refresh:", userType);
      console.log("👤 User email from refresh:", userEmail);
      console.log("📍 Requested path:", pathname);

      // Check if we have valid user data
      if (userType && userEmail) {
        // Check if we need to redirect or can proceed
        const redirectResponse = handleUserTypeRedirect(
          userType,
          pathname,
          request
        );

        // Forward cookies to response (both redirect and next)
        // Backend handles all cookie attributes - we just forward the header
        const setCookieHeader = refreshResponse.headers.get("set-cookie");
        if (setCookieHeader) {
          redirectResponse.headers.set("set-cookie", setCookieHeader);
        }

        return redirectResponse;
      } else {
        console.log(
          "❌ Invalid user data in refresh response - missing userType or email"
        );
        // Invalid user data - clear cookies and redirect to login
        const redirectUrl = new URL("/login", request.url);
        const originalUrl = redirectPathPreservingQuery(request);
        redirectUrl.searchParams.set("redirect", originalUrl);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete("refreshToken");
        response.cookies.delete("accessToken");
        response.headers.set("x-clear-auth", "true");
        return response;
      }
    } catch (error) {
      console.error("💥 Middleware error:", error);
      const redirectUrl = new URL("/login", request.url);
      const originalUrl = redirectPathPreservingQuery(request);
      redirectUrl.searchParams.set("redirect", originalUrl);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("refreshToken");
      response.cookies.delete("accessToken");
      response.headers.set("x-clear-auth", "true");
      return response;
    }
  }

  // 2. Handle auth routes (login, register)
  // If user is already authenticated, redirect them to /search
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    console.log("🔐 Auth route detected");

    // If user has refreshToken, check if they're authenticated
    if (refreshToken) {
      try {
        // Check cache first
        const cacheKey = refreshToken;
        let cachedData = tokenCache.get(cacheKey);
        const now = Date.now();

        // If not found by refreshToken, try to find by any cache entry (fallback)
        if (!cachedData || cachedData.expires <= now) {
          for (const [, value] of tokenCache.entries()) {
            if (value.expires > now && value.data?.data?.user?.userType) {
              cachedData = value;
              break;
            }
          }
        }

        // If we have valid cached user data, redirect to /search
        if (cachedData && cachedData.expires > now) {
          const userType = cachedData.data?.data?.user?.userType;
          const userEmail = cachedData.data?.data?.user?.email;
          if (userType && userEmail) {
            console.log(
              "✅ User already authenticated, redirecting to /search"
            );
            return NextResponse.redirect(new URL("/search", request.url));
          }
        }

        // If no valid cache, try to refresh to get user info
        // Throttle refresh calls
        const lastRefresh = lastRefreshTime.get(refreshToken) ?? 0;
        const timeSinceLastRefresh = now - lastRefresh;

        if (timeSinceLastRefresh >= REFRESH_THROTTLE_MS) {
          console.log("🔄 Checking authentication status...");

          try {
            const apiUrl = getApiBaseUrl();
            
            // Forward all cookies from the incoming request to the backend
            const cookieHeader = request.headers.get("cookie") || "";
            
            // Add timeout to prevent blocking navigation (Edge Runtime supports AbortController)
            let controller: AbortController | null = null;
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            
            try {
              controller = new AbortController();
              timeoutId = setTimeout(() => controller!.abort(), 3000); // 3 second timeout
            } catch {
              // AbortController not available, continue without timeout
              console.log("⚠️ AbortController not available, proceeding without timeout");
            }
            
            const fetchOptions: RequestInit = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader, // Forward all cookies from the request
              },
              credentials: "include",
            };
            
            if (controller) {
              fetchOptions.signal = controller.signal;
            }
            
            const refreshResponse = await fetch(`${apiUrl}/api/auth/refresh`, fetchOptions);

            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            if (refreshResponse.ok) {
              const refreshData: RefreshResponse = await refreshResponse.json();
              const userType = refreshData.data?.user?.userType;
              const userEmail = refreshData.data?.user?.email;

              if (userType && userEmail) {
                console.log("✅ User authenticated, redirecting to /search");

                // Cache the response
                const userId =
                  refreshData.data?.user?._id || refreshData.data?.user?.id;
                const stableCacheKey = userId || refreshToken;
                tokenCache.set(stableCacheKey, {
                  data: refreshData,
                  expires: now + TOKEN_CACHE_MS,
                });

                // Redirect to /search
                const redirectResponse = NextResponse.redirect(
                  new URL("/search", request.url)
                );

                // Forward cookies from backend
                const setCookieHeader = refreshResponse.headers.get("set-cookie");
                if (setCookieHeader) {
                  redirectResponse.headers.set("set-cookie", setCookieHeader);
                }

                lastRefreshTime.set(refreshToken, Date.now());
                return redirectResponse;
              }
            } else {
              // Refresh failed - clear invalid token and allow access to auth page
              console.log("❌ Token refresh failed, allowing access to auth page");
              const response = NextResponse.next();
              response.cookies.delete("refreshToken");
              response.cookies.delete("accessToken");
              return response;
            }
          } catch (fetchError) {
            // Network error or timeout - allow access to auth page
            console.error("💥 Error during token refresh:", fetchError);
            // Clear potentially invalid tokens
            const response = NextResponse.next();
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              console.log("⏱️ Token refresh timed out, allowing access to auth page");
            }
            return response;
          }
        } else {
          // Throttled - allow access to auth page (user might want to login with different account)
          console.log("⏱️ Refresh throttled, allowing access to auth page");
          // Continue to allow access below
        }
      } catch (error) {
        console.error("💥 Error checking auth status:", error);
        // On error, allow access to auth page (user might not be authenticated)
      }
    }

    // If no refreshToken or authentication check failed, allow access to auth page
    console.log("🔐 Allowing access to auth page");
    return NextResponse.next();
  }

  // 3. Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For other routes, allow by default
  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
