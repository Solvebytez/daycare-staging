"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Star, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { formatDaycarePrice } from "../../utils/priceFormatter";
import { useFavorites } from "../../hooks/useFavorites";

interface Daycare {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  price: string | number;
  priceString?: string;
  hours: string;
  description: string;
  features?: string[];
  distance?: number;
  ageRange?: string;
  subsidy?: string;
  phone?: string;
  email?: string;
}

export default function FavoritesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const {
    favorites: apiFavorites,
    isLoading: favoritesLoading,
    removeFavorite: removeFavoriteAPI,
  } = useFavorites();
  const [favoriteDaycares, setFavoriteDaycares] = useState<Daycare[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Transform API favorites to Daycare format
  const apiFavoriteDaycares = useMemo(() => {
    if (!user || !apiFavorites || apiFavorites.length === 0) {
      return [];
    }

    return apiFavorites
      .filter((favorite) => favorite.daycare) // Filter out favorites without daycare data
      .map((favorite) => {
        const daycare = favorite.daycare!;
        const daycareId = daycare._id || daycare.id || favorite.daycareId;

        return {
          id: daycareId,
          name: daycare.name || "Unnamed KinderBridge",
          city: daycare.city || "",
          address: daycare.address || "",
          rating: (daycare.rating as number) || 0,
          price: daycare.price || daycare.monthlyFee || 0,
          priceString: daycare.priceString as string | undefined,
          hours: daycare.hours as string || "",
          description: (daycare.description as string) || "",
          features: (daycare.features as string[]) || [],
          distance: (daycare.distance as number) || 0,
          ageRange: (daycare.ageRange as string) || "",
          subsidy: (daycare.subsidy as string) || "",
          phone: (daycare.phone as string) || "",
          email: (daycare.email as string) || "",
        };
      });
  }, [user, apiFavorites]);

  // Set favorite daycares from API
  useEffect(() => {
    if (user) {
      setFavoriteDaycares(apiFavoriteDaycares);
    }
  }, [user, apiFavoriteDaycares]);

  const removeFavorite = (daycareId: string) => {
    removeFavoriteAPI(daycareId);
  };

  if (isLoading || favoritesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get dashboard URL based on user type
  const getDashboardUrl = (userType: string) => {
    switch (userType) {
      case "provider":
        return "/provider/dashboard";
      case "parent":
        return "/parent/dashboard";
      default:
        return "/dashboard";
    }
  };
  const dashboardUrl = getDashboardUrl(user.userType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href={dashboardUrl}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Your Favorites</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {favoriteDaycares.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Favorites Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start exploring KinderBridge locations and save your favorites!
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Find Daycares
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {favoriteDaycares.length} Favorite
                {favoriteDaycares.length !== 1 ? "s" : ""}
              </h2>
              <Link
                href="/search"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add More
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteDaycares.map((daycare) => (
                <div
                  key={daycare.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {daycare.name}
                      </h3>
                      <button
                        onClick={() => removeFavorite(daycare.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded-lg"
                        title="Remove from favorites"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                        <span className="text-sm font-medium truncate">
                          {daycare.city || daycare.address}
                        </span>
                      </div>

                      {daycare.hours && (
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                          <span className="text-sm font-medium">
                            {daycare.hours}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(daycare.rating || 0)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {daycare.rating || "N/A"}
                        </span>
                      </div>

                      {daycare.description && (
                        <div className="pt-2">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {daycare.description}
                          </p>
                        </div>
                      )}

                      {daycare.features && daycare.features.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {daycare.features
                            .slice(0, 3)
                            .map((feature, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                              >
                                {feature}
                              </span>
                            ))}
                          {daycare.features.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                              +{daycare.features.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">
                          {formatDaycarePrice(daycare.price, daycare.priceString)}
                        </span>
                        <Link
                          href={`/daycare/${(daycare as any).slug || daycare.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
