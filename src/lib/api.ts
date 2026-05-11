import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// API configuration for both development and production
export const getApiBaseUrl = () => {
  // Production URL - use subdomain if available, otherwise fallback to Render
  const PRODUCTION_API_URL = "https://api.kinderbridge.ca";
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    // Staging / preview: honor Vercel env so vacancy-stats and other calls hit the intended API
    if (envUrl) {
      return envUrl;
    }
    const isProduction =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (isProduction) {
      return PRODUCTION_API_URL;
    }

    return "http://localhost:5001";
  }

  if (process.env.NODE_ENV === "production") {
    return envUrl || PRODUCTION_API_URL;
  }

  return envUrl || "http://localhost:5001";
};

// Create axios instance
const apiBaseUrl = getApiBaseUrl();
console.log("🔵 [API] Initializing axios client with baseURL:", apiBaseUrl);

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor - no need to add Authorization header, cookies are sent automatically
apiClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track refresh attempts to prevent infinite loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // If no original request config, reject the error
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip refresh logic for auth endpoints (verify, refresh, login, register, logout, forgot-password, reset-password, email verification)
    const isAuthEndpoint =
      originalRequest.url?.includes("/api/auth/verify") ||
      originalRequest.url?.includes("/api/auth/refresh") ||
      originalRequest.url?.includes("/api/auth/login") ||
      originalRequest.url?.includes("/api/auth/register") ||
      originalRequest.url?.includes("/api/auth/logout") ||
      originalRequest.url?.includes("/api/auth/forgot-password") ||
      originalRequest.url?.includes("/api/auth/reset-password") ||
      originalRequest.url?.includes("/api/auth/verify-email") ||
      originalRequest.url?.includes("/api/auth/resend-verification");

    // If access token expired, try to refresh it (but not for auth endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the access token
        const refreshResponse = await axios.post(
          `${getApiBaseUrl()}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data.success) {
          processQueue(null, refreshResponse.data.data?.accessToken);
          // Retry the original request
          return apiClient(originalRequest);
        } else {
          throw new Error("Token refresh failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear cookies and redirect to login only if not already on login/register page
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/register")
          ) {
            // Clear any auth state
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For 401 errors on auth endpoints, don't redirect (let the component handle it)
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Only redirect if not already on login/register page
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/register")
        ) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Legacy API object for backward compatibility
export const api = {
  baseUrl: getApiBaseUrl(),

  async fetch(endpoint: string, options?: RequestInit) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  },

  // Daycare endpoints
  daycares: {
    getAll: () => api.fetch("/api/daycares"),
    getById: (id: string) => api.fetch(`/api/daycares/detail/${id}`),
    search: (params: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return api.fetch(`/api/daycares/search?${searchParams.toString()}`);
    },
  },
};
