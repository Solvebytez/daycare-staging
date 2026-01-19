"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import CommunicationPreferencesModal from "../../components/CommunicationPreferencesModal";
import AddressAutocomplete from "../../components/AddressAutocomplete";
import { useRegisterMutation } from "../../hooks/useAuthMutations";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  address: string;
  childAge: number;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  childAge?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    address: "",
    childAge: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] =
    useState<Record<string, unknown> | null>(null);
  const [isRegistering, setIsRegistering] = useState(false); // Track if registration is in progress
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  // Redirect if already logged in (but not during registration) - always go to search
  useEffect(() => {
    // Only redirect if not currently registering and user is logged in
    if (!authLoading && !isRegistering && user) {
      // User is already logged in, redirect to search page
      router.push("/search");
    }
  }, [user, authLoading, router, isRegistering]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email || !formData.email.includes("@")) {
      newErrors.email = "Valid email is required";
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name is required (at least 2 characters)";
    }

    // Phone number is optional - no validation needed

    if (!formData.address || formData.address.trim().length === 0) {
      newErrors.address = "Postal address or code is required";
    }

    if (
      !formData.childAge ||
      formData.childAge <= 0 ||
      formData.childAge > 18
    ) {
      newErrors.childAge = "Please enter a valid child age (1-18)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof RegisterFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (registerMutation.isPending || isRegistering) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Prepare registration data but don't submit yet
    const { confirmPassword: _confirmPassword, childAge, fullName, ...registerData } = formData;

    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Convert childAge to children array format for backend
    const registerPayload = {
      ...registerData,
      firstName,
      lastName,
      children: [{ name: "", age: childAge, specialNeeds: "" }],
      userType: "parent", // Default to parent since we're collecting child age
    };

    // Store the registration data and show the preferences modal
    setPendingRegistrationData(registerPayload);
    setShowPreferencesModal(true);
  };

  const handlePreferencesContinue = async (preferences: {
    email: boolean;
    sms: boolean;
    promotional: boolean;
    acknowledgement: boolean;
  }) => {
    // Add communication preferences to registration data
    if (!pendingRegistrationData) {
      console.error("Pending registration data is missing");
      return;
    }
    
    const finalRegistrationData = {
      ...pendingRegistrationData,
      communicationPreferences: preferences,
    } as Parameters<typeof registerMutation.mutate>[0];

    // Use React Query mutation
    setIsRegistering(true); // Set flag to prevent useEffect redirect
    registerMutation.mutate(finalRegistrationData, {
      onSuccess: async (data) => {
        // Verify registration actually succeeded - check if we have user data
        if (!data.success || !data.data?.user) {
          console.error(
            "❌ [REGISTER] Registration response missing required data:",
            data
          );
          toast.error(
            "Registration failed: Invalid response from server. Please try again."
          );
          setIsRegistering(false);
          return;
        }

        // Verify user was actually created - check user has ID
        const user = data.data.user;
        if (!user._id && !user.id) {
          console.error("❌ [REGISTER] User created but missing ID:", user);
          toast.error(
            "Registration failed: User was not properly created. Please contact support."
          );
          setIsRegistering(false);
          return;
        }

        console.log(
          "✅ [REGISTER] Registration verified - User ID:",
          user._id || user.id
        );
        console.log("✅ [REGISTER] User email:", user.email);

        // User is NOT logged in - they must verify email first
        // No tokens are generated until email is verified

        // Show success message
        toast.success(
          `Registration successful! Please check your email to verify your account.`,
          {
            duration: 3000,
          }
        );

        // Redirect to register-success page with email parameter (not logged in yet)
        const userEmail = user.email || "";
        window.location.href = `/register-success${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ""}`;
        // Reset flag (though we're doing full page reload, so this won't matter)
        setIsRegistering(false);
      },
      onError: (error: unknown) => {
        const errorResponse = error as { response?: { data?: { error?: string; details?: string[] } } };
        const errorMessage =
          errorResponse?.response?.data?.error ||
          errorResponse?.response?.data?.details?.join(", ") ||
          (error instanceof Error ? error.message : undefined) ||
          "An error occurred during registration";
        toast.error(errorMessage);
        setIsRegistering(false); // Reset flag on error
      },
    });
  };

  const handlePreferencesClose = () => {
    if (!registerMutation.isPending) {
      setShowPreferencesModal(false);
      setPendingRegistrationData(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back to Home Link */}
        <div className="mb-6 flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600">
            Join KinderBridge and find the perfect care for your family
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Postal Address or Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address or Postal Code *
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(address) => handleInputChange("address", address)}
                placeholder="Enter postal address or code"
                error={errors.address}
                required
              />
            </div>

            {/* Children Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Children Age *
              </label>
              <input
                type="number"
                value={formData.childAge || ""}
                onChange={(e) =>
                  handleInputChange("childAge", parseInt(e.target.value) || 0)
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.childAge ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter child age"
                min="1"
                max="18"
              />
              {errors.childAge && (
                <p className="text-red-500 text-xs mt-1">{errors.childAge}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={registerMutation.isPending || isRegistering}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending || isRegistering
                  ? "Creating Account..."
                  : "Create Account"}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Communication Preferences Modal */}
      <CommunicationPreferencesModal
        isOpen={showPreferencesModal}
        onClose={handlePreferencesClose}
        onContinue={handlePreferencesContinue}
        isLoading={registerMutation.isPending}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
