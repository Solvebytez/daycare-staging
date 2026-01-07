import { apiClient } from "./api";

/**
 * Request password reset - sends email with reset link
 * @param email - User email address
 * @returns Promise with success status
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.post("/api/auth/forgot-password", {
      email,
    });
    return response.data;
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Failed to send password reset email. Please try again.",
    };
  }
}

/**
 * Verify reset token validity
 * @param token - Reset token from URL
 * @returns Promise with token validity status
 */
export async function verifyResetToken(token: string): Promise<{
  success: boolean;
  data?: { email: string; valid: boolean };
  error?: string;
}> {
  try {
    const response = await apiClient.get(`/api/auth/reset-password/${token}`);
    return response.data;
  } catch (error: any) {
    console.error("Token verification error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Invalid or expired reset token",
    };
  }
}

/**
 * Reset password using token
 * @param token - Reset token from URL
 * @param password - New password
 * @returns Promise with success status
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.post("/api/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  } catch (error: any) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Failed to reset password. Please try again.",
    };
  }
}

/**
 * Verify email address using token
 * @param token - Verification token from URL
 * @returns Promise with verification status
 */
export async function verifyEmail(token: string): Promise<{
  success: boolean;
  data?: { email: string; verified: boolean; alreadyVerified?: boolean };
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.get(`/api/auth/verify-email/${token}`);
    return response.data;
  } catch (error: any) {
    console.error("Email verification error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Invalid or expired verification token",
    };
  }
}

/**
 * Resend verification email
 * @param email - User email address
 * @returns Promise with success status
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.post("/api/auth/resend-verification", {
      email,
    });
    return response.data;
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Failed to send verification email. Please try again.",
    };
  }
}

