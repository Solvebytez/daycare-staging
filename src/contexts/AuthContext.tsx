"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: "parent" | "provider" | "employer" | "employee";
  phone?: string;
  address?: string;
  children?: Array<{
    name: string;
    age: number;
    specialNeeds?: string;
  }>;
  daycareId?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLogin?: string;
  profileComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "parent" | "provider" | "employer" | "employee";
  phone?: string;
  address?: string;
  children?: Array<{
    name: string;
    age: number;
    specialNeeds?: string;
  }>;
  daycareId?: string;
  role?: string;
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    promotional: boolean;
    acknowledgement: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Debug: Log the API URL being used
console.log("🔧 DEBUG: API Base URL =", apiClient.defaults.baseURL);
console.log("🔧 DEBUG: NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // Check auth using cookies (withCredentials sends cookies automatically)
      // This endpoint doesn't require authentication, so it won't trigger refresh loop
      const verifyResponse = await apiClient.get("/api/auth/verify");

      if (verifyResponse.data.success && verifyResponse.data.authenticated) {
        // Use user data from verify response if available
        if (verifyResponse.data.data) {
          setUser(verifyResponse.data.data);
          return;
        }
      }

      // If verify returns unauthenticated, check if we have a refresh token cookie
      // Only try refresh if we might have a refresh token (don't spam API)
      // We can't check cookies in client-side, so we'll only try refresh if verify suggests we might be logged in
      // For now, if verify fails, just set user to null - don't try refresh/profile
      // The middleware handles token refresh on protected routes

      // All methods failed - user is not authenticated
      setUser(null);
    } catch (error: unknown) {
      // Handle rate limiting errors gracefully
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 429) {
          console.warn("Rate limited: Too many auth checks. Will retry later.");
          // Don't clear user on rate limit, just log warning
          return;
        }
        // Don't log 401 errors as they're expected for unauthenticated users
        if (axiosError.response?.status === 401) {
          setUser(null);
          return;
        }
      }
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on mount for non-auth pages (login/register handle their own flow)
  // This ensures user state is available when pages load
  useEffect(() => {
    // Don't check auth on login/register pages - they handle their own auth flow
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname === "/login" || pathname === "/register") {
        // On auth pages, just set loading to false
        setIsLoading(false);
        return;
      }
    }
    // For other pages, check auth once on mount
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("🔧 DEBUG: Attempting login to:", apiClient.defaults.baseURL);
    console.log("🔧 DEBUG: Email:", email);

    try {
      setIsLoading(true);

      console.log("🔧 DEBUG: Sending axios request...");
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      console.log("🔧 DEBUG: Response received, status:", response.status);

      if (response.data.success) {
        console.log(
          "🔧 DEBUG: Login successful, user:",
          response.data.data?.user?.email
        );
        const { user: userData } = response.data.data;

        // Tokens are stored in httpOnly cookies automatically
        // Set user
        setUser(userData);
        return true;
      } else {
        console.error(
          "Login failed:",
          response.data.message || response.data.error
        );
        // Throw error with message so login page can display it
        const errorMessage = response.data.message || response.data.error || "Login failed";
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      console.error("🔧 DEBUG: Login axios error:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { 
          response?: { 
            data?: { 
              message?: string; 
              error?: string;
              details?: { requiresVerification?: boolean };
            };
            status?: number;
          } 
        };
        console.error("🔧 DEBUG: Error response:", axiosError.response?.data);
        
        // Extract error message from response
        const errorMessage = axiosError.response?.data?.message || 
                            axiosError.response?.data?.error || 
                            "Login failed";
        throw new Error(errorMessage);
      }
      // Re-throw the error so login page can handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await apiClient.post("/api/auth/register", userData);

      if (response.data.success) {
        const { user: newUser, requiresEmailVerification } = response.data.data;

        // Do NOT set user or tokens - user must verify email before logging in
        if (requiresEmailVerification && !newUser?.emailVerified) {
          console.log("✅ [REGISTER] Registration successful - email verification required");
          // Don't set user - they need to verify email first
          return true;
        }

        // If email is already verified (shouldn't happen on new registration, but handle it)
        if (newUser?.emailVerified) {
          setUser(newUser);
          return true;
        }

        // Default: don't set user if email not verified
        return true;
      } else {
        console.error("Registration failed:", response.data.error);
        const errorMessage =
          response.data.error ||
          response.data.details?.join(", ") ||
          "Registration failed";
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string; details?: string[] } };
        };
        if (axiosError.response?.data) {
          const errorData = axiosError.response.data;
          const errorMessage =
            errorData.error ||
            errorData.details?.join(", ") ||
            "Registration failed";
          throw new Error(errorMessage);
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookies
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all React Query cache and cancel ongoing queries
      queryClient.clear();
      queryClient.cancelQueries();
      
      // Clear local state
      setUser(null);
      setIsLoading(false);
      
      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await apiClient.put("/api/auth/profile", userData);

      if (response.data.success) {
        setUser(response.data.data);
        return true;
      } else {
        console.error("Profile update failed:", response.data.error);
        return false;
      }
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data) {
          console.error(
            "Profile update failed:",
            axiosError.response.data.error
          );
        }
      }
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
