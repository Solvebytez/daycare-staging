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

