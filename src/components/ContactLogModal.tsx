"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MapPinIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useContactLogs } from "@/hooks/useContactLogs";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDaycarePrice } from "@/utils/priceFormatter";
import { useFavorites } from "@/hooks/useFavorites";

interface ContactLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  daycareId?: string; // Optional: if provided, pre-select the daycare
}

interface FormData {
  daycareId: string;
  contactMethod: string;
  purpose: string;
  notes: string;
  outcome: string;
  followUpDate: string;
}

const contactMethods = [
  "Phone Call",
  "Email",
  "In-Person Visit",
  "Video Call",
  "Text Message",
  "Other",
];

const purposes = [
  "Initial Inquiry",
  "Follow-up",
  "Application Status",
  "Schedule Visit",
  "Registered into Waitlist",
  "Question",
  "Other",
];

interface Daycare {
  _id?: string;
  id: string;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  price?: string | number;
  priceString?: string;
  rating?: number;
  [key: string]: unknown;
}

export default function ContactLogModal({
  isOpen,
  onClose,
  daycareId: initialDaycareId,
}: ContactLogModalProps) {
  const { user } = useAuth();
  const { createContactLogMutation, isCreatingContactLog } = useContactLogs();
  const { favorites } = useFavorites();
  const [formData, setFormData] = useState<FormData>({
    daycareId: initialDaycareId || "",
    contactMethod: "",
    purpose: "",
    notes: "",
    outcome: "",
    followUpDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDaycareDropdown, setShowDaycareDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query to avoid too many API calls (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch default daycares (first 10) when dropdown is open but no search query
  const { data: defaultDaycaresResponse, isLoading: isLoadingDefaults } =
    useQuery({
      queryKey: ["daycares", "default-list"],
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          limit: "10", // Limit to 10 default results
          page: "1",
        });
        const response = await apiClient.get(
          `/api/daycares/search?${searchParams.toString()}`
        );
        return response.data;
      },
      enabled: isOpen && showDaycareDropdown && !debouncedSearchQuery.trim(), // Fetch when dropdown is open and no search query
      staleTime: 5 * 60 * 1000, // 5 minutes - default results stay fresh longer
    });

  // Fetch daycares using search API when user types
  const { data: searchDaycaresResponse, isLoading: isSearchingDaycares } =
    useQuery({
      queryKey: ["daycares", "search", debouncedSearchQuery],
      queryFn: async () => {
        if (!debouncedSearchQuery.trim()) {
          return { success: true, data: [] };
        }
        const searchParams = new URLSearchParams({
          q: debouncedSearchQuery.trim(),
          limit: "10", // Limit to 10 results for dropdown
        });
        const response = await apiClient.get(
          `/api/daycares/search?${searchParams.toString()}`
        );
        return response.data;
      },
      enabled:
        isOpen && showDaycareDropdown && debouncedSearchQuery.trim().length > 0, // Only search when user has typed something
      staleTime: 1 * 60 * 1000, // 1 minute - search results stay fresh
    });

  // Get favorite IDs
  const favoriteIds = useMemo(() => {
    return favorites.map(
      (fav) => fav.daycareId || fav.daycare?._id || fav.daycare?.id || ""
    );
  }, [favorites]);

  // Use search results if available, otherwise use default results
  // For default results, show favorites first
  const daycares: Daycare[] = useMemo(() => {
    if (debouncedSearchQuery.trim()) {
      // For search results, return as-is
      return searchDaycaresResponse?.data || [];
    } else {
      // For default results, sort to show favorites first
      const defaultDaycares: Daycare[] = defaultDaycaresResponse?.data || [];
      if (favoriteIds.length === 0 || defaultDaycares.length === 0) {
        return defaultDaycares;
      }

      // Separate favorites and non-favorites
      const favoritesList: Daycare[] = [];
      const nonFavoritesList: Daycare[] = [];

      defaultDaycares.forEach((daycare) => {
        const daycareId = daycare._id || daycare.id;
        if (favoriteIds.includes(daycareId)) {
          favoritesList.push(daycare);
        } else {
          nonFavoritesList.push(daycare);
        }
      });

      // Combine: favorites first, then non-favorites
      return [...favoritesList, ...nonFavoritesList];
    }
  }, [
    debouncedSearchQuery,
    searchDaycaresResponse?.data,
    defaultDaycaresResponse?.data,
    favoriteIds,
  ]);

  const isLoadingDaycares = debouncedSearchQuery.trim()
    ? isSearchingDaycares
    : isLoadingDefaults;

  // Update form when initialDaycareId changes
  useEffect(() => {
    if (initialDaycareId) {
      setFormData((prev) => ({ ...prev, daycareId: initialDaycareId }));
      // Fetch daycare name for display
      apiClient
        .get(`/api/daycares/detail/${initialDaycareId}`)
        .then((response) => {
          if (response.data?.data?.name) {
            setSearchQuery(response.data.data.name);
          }
        })
        .catch(() => {
          // Silently fail if daycare not found
        });
    }
  }, [initialDaycareId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null); // Clear error when user types
  };

  const handleDaycareSelect = (daycare: Daycare) => {
    const id = daycare._id || daycare.id;
    setFormData((prev) => ({ ...prev, daycareId: id }));
    setSearchQuery(daycare.name);
    setShowDaycareDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showDaycareDropdown &&
        !target.closest(".daycare-dropdown-container")
      ) {
        setShowDaycareDropdown(false);
      }
    };

    if (showDaycareDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDaycareDropdown]);

  // If we have a selected daycare ID but it's not in search results, fetch it for display
  const { data: selectedDaycareResponse } = useQuery({
    queryKey: ["daycare", "detail", formData.daycareId],
    queryFn: async () => {
      if (!formData.daycareId) return null;
      try {
        const response = await apiClient.get(
          `/api/daycares/detail/${formData.daycareId}`
        );
        return response.data?.data || null;
      } catch {
        return null;
      }
    },
    enabled: !!formData.daycareId, // Fetch whenever we have a daycare ID
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get selected daycare from search results or from individual fetch
  const selectedDaycare = useMemo(() => {
    if (!formData.daycareId) return null;
    // First check if it's in the current search results
    const found = daycares.find((d) => (d._id || d.id) === formData.daycareId);
    if (found) return found;
    // Otherwise use the individually fetched daycare (for when it's not in search results)
    if (selectedDaycareResponse) {
      return {
        _id: selectedDaycareResponse._id,
        id: selectedDaycareResponse._id || selectedDaycareResponse.id,
        name: selectedDaycareResponse.name,
        address: selectedDaycareResponse.address,
        city: selectedDaycareResponse.city,
      };
    }
    return null;
  }, [formData.daycareId, daycares, selectedDaycareResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.daycareId) {
      setError("Please select a daycare");
      return;
    }

    if (!formData.contactMethod) {
      setError("Please select a contact method");
      return;
    }

    if (!formData.purpose) {
      setError("Please select a purpose");
      return;
    }


    createContactLogMutation.mutate(
      {
        daycareId: formData.daycareId,
        contactMethod: formData.contactMethod,
        purpose: formData.purpose,
        notes: formData.notes,
        outcome: formData.outcome || undefined,
        followUpDate: formData.followUpDate || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setFormData({
            daycareId: initialDaycareId || "",
            contactMethod: "",
            purpose: "",
            notes: "",
            outcome: "",
            followUpDate: "",
          });
          setSearchQuery("");
          setError(null);
          onClose();
        },
        onError: (err: unknown) => {
          const errorResponse = err as { response?: { data?: { error?: string; message?: string } } };
          setError(
            errorResponse?.response?.data?.error ||
              errorResponse?.response?.data?.message ||
              "Failed to log contact. Please try again."
          );
        },
      }
    );
  };

  if (!isOpen) return null;

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.lastName || user?.email || "User";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-gray-600 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Log New Contact
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Record your communication with a KinderBridge location to
                  track progress.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isCreatingContactLog}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logged in as */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-2" />
                  Logged in as:
                </label>
                <input
                  type="text"
                  value={userName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Select Daycare */}
              <div className="relative daycare-dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOfficeIcon className="h-4 w-4 inline mr-2" />
                  Select Daycare <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDaycareDropdown(true);
                      // Clear daycare selection if user clears the input
                      if (!e.target.value) {
                        setFormData((prev) => ({ ...prev, daycareId: "" }));
                      }
                    }}
                    onFocus={() => {
                      setShowDaycareDropdown(true);
                    }}
                    placeholder="Search for a Daycare"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {showDaycareDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                      {isLoadingDaycares ? (
                        <div className="px-6 py-8 text-center">
                          <div className="inline-flex items-center space-x-2 text-gray-500">
                            <svg
                              className="animate-spin h-5 w-5"
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
                            <span>
                              {debouncedSearchQuery.trim()
                                ? "Searching..."
                                : "Loading..."}
                            </span>
                          </div>
                        </div>
                      ) : daycares.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                          {debouncedSearchQuery.trim() ? (
                            <p>
                              No KinderBridge locations found. Try a different
                              search term.
                            </p>
                          ) : (
                            <>
                              <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>No KinderBridge locations available.</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {daycares.map((daycare) => (
                            <button
                              key={daycare._id || daycare.id}
                              type="button"
                              onClick={() => handleDaycareSelect(daycare)}
                              className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 hover:bg-blue-50/50"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="font-semibold text-gray-900 text-base truncate">
                                      {daycare.name}
                                    </h4>
                                    {favoriteIds.includes(daycare._id || daycare.id) && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 flex-shrink-0">
                                        <HeartIcon className="h-3 w-3 fill-red-600" />
                                        Favorite
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                                    {(daycare.address || daycare.city) && (
                                      <div className="flex items-center space-x-1">
                                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">
                                          {[daycare.address, daycare.city]
                                            .filter(Boolean)
                                            .join(", ")}
                                        </span>
                                      </div>
                                    )}
                                    {daycare.region && (
                                      <div className="flex items-center space-x-1">
                                        <span>•</span>
                                        <span>{daycare.region}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    {daycare.price && (
                                      <span className="text-green-600 font-medium">
                                        {formatDaycarePrice(daycare.price, daycare.priceString)}
                                      </span>
                                    )}
                                    {daycare.rating && (
                                      <span className="text-gray-600">
                                        ⭐ {daycare.rating}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">How did you contact them?</option>
                  {contactMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">What was the purpose?</option>
                  {purposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="What happened during this contact?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={1000}
                />
                <div className="mt-1 text-xs text-gray-500">
                  {formData.notes.length}/1000 characters
                </div>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome (optional)
                </label>
                <input
                  type="text"
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleInputChange}
                  placeholder="What was the result?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Follow-up Date (optional)
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreatingContactLog}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingContactLog}
                  className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                >
                  {isCreatingContactLog ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      Logging...
                    </>
                  ) : (
                    "Log Contact"
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


