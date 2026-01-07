"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";

function RegisterSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    
    // Get email from URL parameter if available
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Wait for component to mount before rendering
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Your account has been created successfully. Please verify your email address to complete your registration and log in.
          </p>

          {/* Email Verification Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Verify Your Email Address
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    We've sent a verification email to{" "}
                    {email ? (
                      <strong className="font-semibold">{email}</strong>
                    ) : (
                      "your email address"
                    )}.
                  </p>
                  <p>
                    Please check your inbox and click the verification link to activate your account.
                  </p>
                  <p className="text-blue-600 font-medium mt-3">
                    You must verify your email before you can log in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> After verifying your email, you'll be able to log in to your account.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {email && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}`}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Resend Verification Email</span>
              </Link>
            )}

            <Link
              href="/login"
              className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <span>Go to Login</span>
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center space-x-2 text-gray-600 px-6 py-3 rounded-lg font-medium hover:text-gray-800 transition-colors"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterSuccessContent />
    </Suspense>
  );
}
