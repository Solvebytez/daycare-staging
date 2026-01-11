"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Users,
  Heart,
  ArrowLeft,
  Calendar,
  Shield,
  Award,
  Car,
  Leaf,
  Music,
  BookOpen,
  Palette,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import daycaresData from "../../../data/daycares.json";
import LocationMap from "./components/LocationMap";
import { apiClient } from "@/lib/api";
import { formatDaycarePrice } from "../../../utils/priceFormatter";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";

interface Daycare {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  region: string;
  hours: string;
  ageRange: string;
  subsidy: string;
  cwelcc: string;
  features: string[];
  ageGroups: string[];
  rating: number;
  price: string | number;
  priceString?: string;
  distance: number;
  availability: string;
  images: string[];
}

export default function DaycareDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const {
    favorites: apiFavorites,
    addFavorite: addFavoriteAPI,
    removeFavorite: removeFavoriteAPI,
  } = useFavorites();
  const [daycare, setDaycare] = useState<Daycare | null>(null);
  const [id, setId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get favorite IDs from API
  const favoriteIds = apiFavorites.map(
    (fav) => fav.daycareId || fav.daycare?._id || fav.daycare?.id || ""
  );
  const isFavorite = id ? favoriteIds.includes(id) : false;

  useEffect(() => {
    // Handle async params and fetch daycare data
    const getParams = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const resolvedParams = await params;
        setId(resolvedParams.id);

        // Try to fetch from API first
        try {
          const response = await apiClient.get(
            `/api/daycares/detail/${resolvedParams.id}`
          );
          if (response.data.success && response.data.data) {
            const apiDaycare = response.data.data;
            // Transform API response to match Daycare interface
            const transformedDaycare: Daycare = {
              id: apiDaycare._id || apiDaycare.id || resolvedParams.id,
              name: apiDaycare.name || "Unknown KinderBridge",
              description: apiDaycare.description || "No description available",
              address: apiDaycare.address || "",
              city: apiDaycare.city || "",
              phone: apiDaycare.phone || "",
              email: apiDaycare.email || "",
              website: apiDaycare.website || "",
              region: apiDaycare.region || "",
              hours: apiDaycare.hours || "",
              ageRange: apiDaycare.ageRange || "",
              subsidy: apiDaycare.subsidyAvailable ? "Yes" : "No",
              cwelcc: apiDaycare.cwelcc ? "Yes" : "No",
              features: apiDaycare.features || [],
              ageGroups: apiDaycare.ageGroups
                ? Object.keys(apiDaycare.ageGroups)
                : [],
              rating: apiDaycare.rating || 0,
              price: apiDaycare.price || 0,
              priceString: apiDaycare.priceString,
              distance: apiDaycare.distance || 0,
              availability: apiDaycare.availability || "Unknown",
              images: apiDaycare.images || [],
            };
            setDaycare(transformedDaycare);
            setIsLoading(false);
          }
        } catch (apiError) {
          // If API fails, fallback to local JSON data
          console.warn("API fetch failed, trying local data:", apiError);
          const foundDaycare = daycaresData.find(
            (d) => d.id === resolvedParams.id
          );
          if (foundDaycare) {
            setDaycare(foundDaycare);
            setIsLoading(false);
          } else {
            setError("KinderBridge not found");
            setIsLoading(false);
          }
        }

      } catch (err) {
        console.error("Error loading daycare:", err);
        setError("Failed to load KinderBridge");
        setIsLoading(false);
      }
    };

    getParams();
  }, [params]);

  // Helper function to save URL to localStorage reliably
  const saveRedirectUrl = (url: string): boolean => {
    try {
      // Try to save
      localStorage.setItem("searchRedirectUrl", url);
      // Verify it was saved correctly
      const saved = localStorage.getItem("searchRedirectUrl");
      if (saved === url) {
        return true;
      }
      // If verification failed, try one more time
      localStorage.setItem("searchRedirectUrl", url);
      const savedAgain = localStorage.getItem("searchRedirectUrl");
      return savedAgain === url;
    } catch (error) {
      // localStorage might be disabled or full
      return false;
    }
  };

  const toggleFavorite = () => {
    if (user) {
      // For logged-in users, use API
      if (isFavorite) {
        removeFavoriteAPI(id);
      } else {
        addFavoriteAPI(id);
      }
    } else {
      // For guest users, save URL and redirect to login
      const currentUrl = window.location.pathname + window.location.search;
      // Save to localStorage as backup (redirect parameter in URL is primary)
      saveRedirectUrl(currentUrl);
      // Redirect - redirect parameter in URL is primary, localStorage is backup
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
    }
  };

  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if string is a URL
  const isURL = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "licensed":
        return <Shield className="h-5 w-5 text-green-600" />;
      case "safe environment":
        return <Award className="h-5 w-5 text-blue-600" />;
      case "educational programs":
        return <BookOpen className="h-5 w-5 text-purple-600" />;
      case "nutritious meals":
        return <Utensils className="h-5 w-5 text-orange-600" />;
      case "outdoor play":
        return <Leaf className="h-5 w-5 text-green-600" />;
      case "music & arts":
        return <Music className="h-5 w-5 text-pink-600" />;
      case "creative activities":
        return <Palette className="h-5 w-5 text-yellow-600" />;
      case "transportation":
        return <Car className="h-5 w-5 text-gray-600" />;
      default:
        return <Award className="h-5 w-5 text-blue-600" />;
    }
  };

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading KinderBridge details...</p>
        </div>
      </div>
    );
  }

  // Show error/not found state only after loading is complete
  if (!daycare || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            KinderBridge Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The KinderBridge location you&apos;re looking for doesn&apos;t
            exist.
          </p>
          <Link
            href="/search"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/search"
                className="text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {daycare.name}
              </h1>
            </div>
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition-colors ${
                isFavorite
                  ? "text-red-600 bg-red-50"
                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              <Heart
                className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
        >
          {/* Image Placeholder */}
          <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🏫</div>
              <p className="text-lg font-medium">Daycare Image</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {daycare.name}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{daycare.city}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{daycare.rating} (Verified)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{daycare.distance} km away</span>
                  </div>
                </div>
                {daycare.description &&
                  daycare.description !== "NO" &&
                  daycare.description.trim() !== "" && (
                    <p className="text-gray-700 text-lg">{daycare.description}</p>
                  )}
              </div>
              <div className="lg:ml-6 mt-4 lg:mt-0">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatDaycarePrice(daycare.price, daycare.priceString)}
                </div>
                {/* Contact Provider button - temporarily hidden */}
                {/* <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Contact Provider
                </button> */}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About This Daycare
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Operating Hours
                    </h3>
                    <p className="text-gray-600">{daycare.hours}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Age Range</h3>
                    <p className="text-gray-600">{daycare.ageRange}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Licensing & Accreditation
                    </h3>
                    <p className="text-gray-600">
                      {daycare.subsidy === "Yes"
                        ? "Subsidy Available"
                        : "No Subsidy"}{" "}
                      •
                      {daycare.cwelcc === "Yes"
                        ? " CWELCC Approved"
                        : " Not CWELCC Approved"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Availability</h3>
                    <p className="text-gray-600">{daycare.availability}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features Section - Only show if features exist */}
            {daycare.features && daycare.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Features & Programs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {daycare.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {getFeatureIcon(feature)}
                      <span className="font-medium text-gray-900">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Cost Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cost Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Monthly Tuition</span>
                  <span className="font-semibold text-gray-900">
                    {formatDaycarePrice(daycare.price, daycare.priceString)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Registration Fee</span>
                  <span className="font-semibold text-gray-900">$150</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Annual Cost</span>
                  <span className="font-semibold text-gray-900">
                    {(() => {
                      // Extract numeric value from price for calculation
                      const priceValue = typeof daycare.price === "number" 
                        ? daycare.price 
                        : typeof daycare.price === "string"
                        ? parseFloat(daycare.price.replace(/[^0-9.]/g, "")) || 0
                        : daycare.priceString
                        ? parseFloat(daycare.priceString.split("-")[0].replace(/[^0-9.]/g, "")) || 0
                        : 0;
                      const annual = priceValue * 12 + 150;
                      return `$${annual.toLocaleString()}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Subsidy Available</span>
                  <span
                    className={`font-semibold ${
                      daycare.subsidy === "Yes"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {daycare.subsidy}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {daycare.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 break-words">
                      {daycare.phone}
                    </span>
                  </div>
                )}
                {daycare.email &&
                  isValidEmail(daycare.email) &&
                  !isURL(daycare.email) && (
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <a
                        href={`mailto:${daycare.email}`}
                        className="text-gray-700 break-all overflow-wrap-anywhere hover:text-blue-600"
                      >
                        {daycare.email}
                      </a>
                    </div>
                  )}
                {(daycare.website ||
                  (daycare.email && isURL(daycare.email))) && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {(() => {
                        // Use website if available, otherwise use email if it's a URL
                        const url =
                          daycare.website ||
                          (daycare.email && isURL(daycare.email)
                            ? daycare.email
                            : "");
                        if (!url) return null;
                        return (
                          <>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 break-all overflow-wrap-anywhere inline-block"
                              title={url}
                            >
                              {url.length > 50
                                ? `${url.substring(0, 50)}...`
                                : url}
                            </a>
                            <div className="mt-1">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Visit Website →
                              </a>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Location</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">
                      {daycare.address}
                    </p>
                    <p className="text-gray-600">{daycare.city}</p>
                    <p className="text-gray-600">{daycare.region}</p>
                  </div>
                </div>
                <LocationMap
                  address={daycare.address}
                  city={daycare.city}
                  name={daycare.name}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
