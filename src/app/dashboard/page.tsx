"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Heart, Settings } from "lucide-react";
import Navigation from "../../components/Navigation";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.push("/login");
      } else if (user.userType === "provider") {
        // Provider users go to provider dashboard
        router.push("/provider/dashboard");
      } else if (user.userType === "parent") {
        // Parent users go to parent dashboard
        router.push("/parent/dashboard");
      }
      // Employer, employee, and other roles stay on this generic dashboard
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect states for provider/parent (will redirect via useEffect)
  if (!user || user.userType === "provider" || user.userType === "parent") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to KinderBridge, {user.firstName}! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your account has been successfully created. Here&apos;s what you
              can do next:
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Find KinderBridge */}
          <Link href="/search" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Find KinderBridge
                  </h3>
                  <p className="text-gray-600">
                    Search for KinderBridge locations in your area
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Favorites */}
          <Link href="/favorites" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Favorites
                  </h3>
                  <p className="text-gray-600">
                    View your saved KinderBridge locations
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Profile Settings */}
          <Link href="/profile" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Profile
                  </h3>
                  <p className="text-gray-600">
                    Update your account information
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Get Started */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-blue-100 mb-4">
                Begin your search for the perfect KinderBridge
              </p>
              <Link
                href="/search"
                className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Start Searching
              </Link>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="text-gray-900 capitalize">{user.userType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{user.phone || "Not provided"}</p>
            </div>
            {user.children && user.children.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Children</p>
                <div className="space-y-2">
                  {user.children.map((child, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-900">
                        {child.name}, Age {child.age}
                        {child.specialNeeds &&
                          child.specialNeeds !== "None" && (
                            <span className="text-sm text-gray-500 ml-2">
                              (Special needs: {child.specialNeeds})
                            </span>
                          )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
