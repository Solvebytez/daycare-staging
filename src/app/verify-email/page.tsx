"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, XCircle } from "lucide-react";
import { verifyEmail, resendVerificationEmail } from "../../lib/authService";

function VerifyEmailForm() {
  const [token, setToken] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token and email from URL query parameters
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    // Set email if provided in URL
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmailToken(tokenParam);
    } else {
      setIsVerifying(false);
      // If email is provided but no token, show resend option
      if (emailParam) {
        setError("Please check your inbox and spam folder for the verification link, or resend it below.");
      } else {
        setError("Invalid verification link. Please check your inbox and spam folder.");
      }
    }
  }, [searchParams]);

  const verifyEmailToken = async (tokenToVerify: string) => {
    try {
      setIsVerifying(true);
      setError("");
      const result = await verifyEmail(tokenToVerify);
      if (result.success) {
        if (result.data?.alreadyVerified) {
          setAlreadyVerified(true);
          setEmail(result.data.email || "");
        } else {
          setSuccess(true);
          setEmail(result.data?.email || "");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } else {
        setError(
          result.error || "Invalid or expired verification token. Please request a new verification email."
        );
      }
    } catch (error) {
      setError("Failed to verify email. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email address is required to resend verification email.");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setSuccess(true);
        setError("");
      } else {
        setError(result.error || "Failed to resend verification email.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  // Show success message
  if (success && !alreadyVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. Redirecting to login...
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Go to login page →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show already verified message
  if (alreadyVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Already Verified
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email ({email}) is already verified. You can log in normally.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show error message with resend option
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Login Link */}
        <div className="flex items-center justify-center">
          <Link
            href="/login"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verification Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error || "This verification link is invalid or has expired."}
          </p>
        </div>

        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Need a new verification email?
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Enter your email address below and we'll send you a new
                  verification link.
                </p>
                <p className="mt-2">
                  <strong>Tip:</strong> Don't forget to check your <strong>spam folder</strong> if you don't see the email in your inbox.
                </p>
              </div>
              <div className="mt-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isResending}
                />
                <button
                  onClick={handleResend}
                  disabled={isResending || !email}
                  className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}

