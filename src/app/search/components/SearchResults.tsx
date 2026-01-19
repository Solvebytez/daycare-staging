"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Star, Lock, UserPlus, List, Map } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import MapView from "./MapView";
import { formatDaycarePrice } from "../../../utils/priceFormatter";

export interface Daycare {
  id: string;
  name: string;
  description: string;
  city: string;
  address: string;
  price: string | number;
  priceString?: string;
  rating: number;
  distance: number;
  features: string[];
  ageRange: string;
  availability: string;
  hours: string;
  subsidy: string;
  cwelcc: string;
  phone: string;
  email: string;
  website?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SearchResultsProps {
  isLoading: boolean;
  isFetching: boolean;
  displayedDaycares: Daycare[];
  allDaycaresForMap?: Daycare[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isGuest: boolean;
  hasPurchasedReport: boolean;
  hasMoreResults: boolean;
  compareList: string[];
  favorites: string[];
  favoriteLoadingId?: string | null;
  onToggleCompare: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (daycare: Daycare) => void;
  onAddToRecentlyViewed: (daycare: Daycare) => void;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export default function SearchResults({
  isLoading,
  isFetching,
  displayedDaycares,
  allDaycaresForMap,
  totalCount,
  totalPages,
  currentPage,
  isGuest,
  hasPurchasedReport,
  hasMoreResults,
  compareList,
  favorites,
  favoriteLoadingId,
  onToggleCompare,
  onToggleFavorite,
  onViewDetails,
  onAddToRecentlyViewed,
  onPageChange,
  onPreviousPage,
  onNextPage,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Use all daycares for map view if available, otherwise use displayed daycares
  const mapDaycares = allDaycaresForMap || displayedDaycares;

  return (
    <div className="flex-1">
      {/* Results Section Header */}
      {isLoading && displayedDaycares.length === 0 ? (
        <div className="mb-6 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-40 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-16 w-full bg-gray-200 rounded-lg"></div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Search className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Search Results
              </h2>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title="List View"
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "map"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Map View"
                >
                  <Map className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`px-3 py-1.5 rounded-lg ${
                  isGuest ? "bg-orange-50" : "bg-blue-50"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    isGuest ? "text-orange-700" : "text-blue-700"
                  }`}
                >
                  {isGuest ? (
                    hasMoreResults ? (
                      <>
                        Showing {displayedDaycares.length} of {totalCount}{" "}
                        results
                        <br />
                        <span className="text-orange-600 font-semibold">
                          Sign up to see all results
                        </span>
                      </>
                    ) : (
                      <>
                        Showing {displayedDaycares.length} of {totalCount}{" "}
                        results
                      </>
                    )
                  ) : hasPurchasedReport ? (
                    <>
                      Page {currentPage} of {totalPages} •{" "}
                      {displayedDaycares.length} of {totalCount} results
                    </>
                  ) : hasMoreResults ? (
                    <>
                      Showing {displayedDaycares.length} of {totalCount} results
                    </>
                  ) : (
                    <>
                      Showing {displayedDaycares.length} of {totalCount} results
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border ${
              isGuest && hasMoreResults
                ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
                : "bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isGuest && hasMoreResults ? "text-orange-700" : "text-gray-700"
              }`}
            >
              {totalCount > 0
                ? isGuest && hasMoreResults
                  ? `${totalCount} daycares locations matching your criteria (showing ${displayedDaycares.length} for guests)`
                  : `${totalCount} daycares locations matching your criteria`
                : "No daycares found. Try adjusting your filters."}
            </p>
          </div>
        </div>
      )}

      {/* Map View or List View */}
      {viewMode === "map" ? (
        <MapView
          daycares={mapDaycares}
          onMarkerClick={(daycare) => {
            onViewDetails(daycare);
            onAddToRecentlyViewed(daycare);
          }}
          isLoading={isLoading}
        />
      ) : (
        <>
          {/* Daycare Cards */}
          <div className="space-y-4">
            {/* Skeleton loaders for daycare cards */}
            {isLoading && displayedDaycares.length === 0 ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden animate-pulse"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-48 lg:h-32 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                          <div className="flex space-x-4">
                            <div className="h-4 w-20 bg-gray-200 rounded"></div>
                            <div className="h-4 w-20 bg-gray-200 rounded"></div>
                            <div className="h-4 w-20 bg-gray-200 rounded"></div>
                          </div>
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                          <div className="flex space-x-2 mt-4">
                            <div className="h-8 w-24 bg-gray-200 rounded"></div>
                            <div className="h-8 w-24 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Fetching indicator */}
                {isFetching && displayedDaycares.length > 0 && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span>Updating results...</span>
                    </div>
                  </div>
                )}

                {displayedDaycares.map((daycare) => {
                  return (
                  <motion.div
                    key={daycare.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Image Placeholder */}
                        <div className="lg:w-48 lg:h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-blue-300 transition-colors">
                          <div className="text-center">
                            <div className="text-4xl mb-1">🏠</div>
                            <div className="text-xs text-gray-500 font-medium">
                              KinderBridge Image
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {daycare.name}
                              </h3>
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-sm">
                                    {daycare.city}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <span>•</span>
                                  <span className="text-sm">
                                    {daycare.distance} km away
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={compareList.includes(daycare.id)}
                                  onChange={() => onToggleCompare(daycare.id)}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-xs text-gray-700">
                                  Compare
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Rating and Price */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="font-semibold text-gray-900 text-sm">
                                  {daycare.rating}
                                </span>
                                <span className="text-gray-600 text-xs">
                                  (Verified)
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {formatDaycarePrice(daycare.price, daycare.priceString)}
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          {daycare.features &&
                            Array.isArray(daycare.features) && (
                              <div className="flex flex-wrap gap-1.5">
                                {daycare.features
                                  .slice(0, 6)
                                  .map((feature: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                              </div>
                            )}

                          {/* Cost Breakdown */}
                          <div className="bg-gray-100 rounded-lg p-3">
                            <h4 className="font-bold text-gray-900 mb-3 text-sm">
                              Cost Breakdown
                            </h4>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium text-xs">
                                  Monthly Tuition:
                                </span>
                                <span className="font-bold text-gray-900 text-xs">
                                  {formatDaycarePrice(daycare.price, daycare.priceString)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium text-xs">
                                  Registration Fee:
                                </span>
                                <span className="font-bold text-gray-900 text-xs">
                                  $100 (one-time)
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium text-xs">
                                  Late Pickup:
                                </span>
                                <span className="font-bold text-gray-900 text-xs">
                                  $15/hour
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium text-xs">
                                  Subsidy Available:
                                </span>
                                <span className="font-bold text-gray-900 text-xs">
                                  {daycare.subsidy}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-3">
                            <button
                              onClick={() => {
                                onViewDetails(daycare);
                                onAddToRecentlyViewed(daycare);
                              }}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm whitespace-nowrap"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => onToggleFavorite(daycare.id)}
                              disabled={favoriteLoadingId === daycare.id}
                              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                                favorites.includes(daycare.id)
                                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                  : "bg-gradient-to-r from-pink-100 to-pink-200 hover:from-pink-200 hover:to-pink-300 text-pink-600 border-2 border-pink-300 hover:border-pink-400"
                              }`}
                              title={
                                favoriteLoadingId === daycare.id
                                  ? "Processing..."
                                  : favorites.includes(daycare.id)
                                  ? "Remove from Favorites"
                                  : "Add to Favorites"
                              }
                            >
                              {favoriteLoadingId === daycare.id ? (
                                <span className="inline-flex items-center">
                                  <svg
                                    className="animate-spin h-4 w-4 mr-2"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Loading...
                                </span>
                              ) : favorites.includes(daycare.id) ? (
                                "❤️"
                              ) : (
                                "💖"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </>
            )}
          </div>

          {/* No Results */}
          {displayedDaycares.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="text-gray-400 text-4xl">🔍</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No daycares found
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                Try adjusting your search criteria or location.
              </p>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 max-w-md mx-auto">
                <p className="text-blue-700 text-sm">
                  💡 <strong>Tip:</strong> Try removing some filters or
                  broadening your search to see more results.
                </p>
              </div>
            </div>
          )}

          {/* Guest Limitation Banner */}
          {isGuest && hasMoreResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-lg"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Unlock All {totalCount} Results
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  You&apos;re seeing only 4 of {totalCount} daycares. Sign up
                  for free to access all results, save favorites, compare
                  daycares, and get personalized recommendations.
                </p>

                {/* --- INSERT START (Around Line 465) --- */}
                <div className="max-w-md mx-auto mb-10 p-6 bg-white rounded-3xl border-4 border-yellow-400 shadow-xl relative text-left">
                  <div className="absolute -top-4 -right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-lg uppercase">
                    ONLY 100 SPOTS
                  </div>
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-black text-gray-900">Auto Apply Feature</h4>
                    <p className="text-green-600 font-bold flex items-center justify-center gap-2 text-xs">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Claim Your Free Access after our Beta Launch!
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {[
                      "Submit to 30 daycares at once",
                      "Automated follow-up reminders",
                      "Compare daycares side-by-side",
                      "Smart follow-up scheduling",
                      "Application tracking dashboard"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 font-semibold text-xs">
                        <div className="mt-0.5 bg-green-100 rounded-full p-0.5">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block w-full py-3 rounded-xl text-white text-center font-black bg-gradient-to-r from-blue-600 to-purple-600 shadow-md text-sm">
                    CLAIM MY FREE SPOT
                  </Link>
                  <p className="text-center text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tight">
                    🚀 NO PAYMENT REQUIRED
                  </p>
                </div>
                {/* --- INSERT END --- */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Sign Up Free</span>
                  </Link>
                  <button
                    onClick={() => {
                      const currentUrl = window.location.pathname + window.location.search;
                      // Save to localStorage as backup (redirect parameter in URL is primary)
                      try {
                        localStorage.setItem("searchRedirectUrl", currentUrl);
                        // Verify save worked
                        if (localStorage.getItem("searchRedirectUrl") !== currentUrl) {
                          localStorage.setItem("searchRedirectUrl", currentUrl);
                        }
                      } catch {
                        // localStorage might be disabled - redirect parameter will still work
                      }
                      // Redirect immediately - localStorage.setItem is synchronous
                      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
                    }}
                    className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>Already have an account? Sign In</span>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Unlimited search results</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Save favorites & compare</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center space-y-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • {totalCount} total results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 shadow-sm"
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 shadow-sm"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={onNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 shadow-sm"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
