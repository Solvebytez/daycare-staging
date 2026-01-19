"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "../../lib/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send password reset email");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Check your email
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    If an account exists with that email, a password reset link
                    has been sent. Please check your <strong>inbox and spam folder</strong> and follow the
                    instructions.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-green-800 hover:text-green-900 underline"
                  >
                    Return to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
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
          </form>
        )}
      </div>
    </div>
  );
}

