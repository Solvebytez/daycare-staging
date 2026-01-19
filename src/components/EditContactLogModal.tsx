"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
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

interface ContactLog {
  _id: string;
  userId: string;
  daycareId: string;
  contactMethod: string;
  purpose: string;
  notes: string;
  outcome?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  daycare?: {
    _id?: string;
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    [key: string]: unknown;
  };
}

interface EditContactLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactLog: ContactLog | null;
}

const CONTACT_METHODS = [
  "Phone Call",
  "Email",
  "In-Person Visit",
  "Video Call",
  "Text Message",
  "Other",
];

const PURPOSES = [
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

export default function EditContactLogModal({
  isOpen,
  onClose,
  contactLog,
}: EditContactLogModalProps) {
  const { user } = useAuth();
  const { updateContactLog, isUpdatingContactLog } = useContactLogs();
  const { favorites } = useFavorites();

  const [formData, setFormData] = useState({
    daycareId: "",
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
      queryKey: ["daycares", "default-list", "edit"],
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          limit: "10",
          page: "1",
        });
        const response = await apiClient.get(
          `/api/daycares/search?${searchParams.toString()}`
        );
        return response.data;
      },
      enabled: isOpen && showDaycareDropdown && !debouncedSearchQuery.trim(),
      staleTime: 5 * 60 * 1000,
    });

  // Fetch daycares using search API when user types
  const { data: searchDaycaresResponse, isLoading: isSearchingDaycares } =
    useQuery({
      queryKey: ["daycares", "search", debouncedSearchQuery, "edit"],
      queryFn: async () => {
        if (!debouncedSearchQuery.trim()) {
          return { success: true, data: [] };
        }
        const searchParams = new URLSearchParams({
          q: debouncedSearchQuery.trim(),
          limit: "10",
        });
        const response = await apiClient.get(
          `/api/daycares/search?${searchParams.toString()}`
        );
        return response.data;
      },
      enabled:
        isOpen && showDaycareDropdown && debouncedSearchQuery.trim().length > 0,
      staleTime: 1 * 60 * 1000,
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

  // Pre-populate form when contactLog changes
  useEffect(() => {
    if (contactLog && isOpen) {
      const daycareId =
        contactLog.daycareId ||
        contactLog.daycare?._id ||
        contactLog.daycare?.id ||
        "";
      setFormData({
        daycareId,
        contactMethod: contactLog.contactMethod || "",
        purpose: contactLog.purpose || "",
        notes: contactLog.notes || "",
        outcome: contactLog.outcome || "",
        followUpDate: contactLog.followUpDate
          ? new Date(contactLog.followUpDate).toISOString().split("T")[0]
          : "",
      });
      // Set search query to daycare name if available
      if (contactLog.daycare?.name) {
        setSearchQuery(contactLog.daycare.name);
      } else if (daycareId) {
        // Fetch daycare name if not available
        apiClient
          .get(`/api/daycares/detail/${daycareId}`)
          .then((response) => {
            if (response.data?.data?.name) {
              setSearchQuery(response.data.data.name);
            }
          })
          .catch(() => {
            // Silently fail if daycare not found
          });
      }
      setError(null);
    }
  }, [contactLog, isOpen]);

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
    queryKey: ["daycare", "detail", formData.daycareId, "edit"],
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
    enabled: !!formData.daycareId && isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Get selected daycare from search results or from individual fetch
  // Note: This is computed but currently unused, kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _selectedDaycare = useMemo(() => {
    if (!formData.daycareId) return null;
    const found = daycares.find((d) => (d._id || d.id) === formData.daycareId);
    if (found) return found;
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

    if (!contactLog) {
      setError("Contact log not found");
      return;
    }

    // Validation
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

    // Prepare update data
    const updateData: {
      daycareId: string;
      contactMethod: string;
      purpose: string;
      notes?: string;
      outcome?: string;
      followUpDate?: string;
    } = {
      daycareId: formData.daycareId,
      contactMethod: formData.contactMethod,
      purpose: formData.purpose,
    };

    // Only include notes if provided
    if (formData.notes && formData.notes.trim()) {
      updateData.notes = formData.notes.trim();
    }

    if (formData.outcome && formData.outcome.trim()) {
      updateData.outcome = formData.outcome.trim();
    }

    if (formData.followUpDate) {
      updateData.followUpDate = new Date(formData.followUpDate).toISOString();
    }

    updateContactLog(
      {
        contactLogId: contactLog._id,
        updateData,
      },
      {
        onSuccess: () => {
          onClose();
          setError(null);
        },
        onError: (err: unknown) => {
          const errorResponse = err as { response?: { data?: { error?: string; message?: string } } };
          setError(
            errorResponse?.response?.data?.error ||
              errorResponse?.response?.data?.message ||
              "Failed to update contact log. Please try again."
          );
        },
      }
    );
  };

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log("EditContactLogModal - isOpen:", isOpen, "contactLog:", contactLog);
    }
  }, [isOpen, contactLog]);

  if (!isOpen || !contactLog) {
    console.log("EditContactLogModal - Not rendering. isOpen:", isOpen, "contactLog:", contactLog);
    return null;
  }

  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.toUpperCase()
      : user?.email || "User";

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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Contact Log
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Update your contact log information
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isUpdatingContactLog}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto flex flex-col"
          >
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

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
                      if (!e.target.value) {
                        setFormData((prev) => ({ ...prev, daycareId: "" }));
                      }
                    }}
                    onFocus={() => {
                      setShowDaycareDropdown(true);
                    }}
                    disabled={isUpdatingContactLog}
                    placeholder="Search for a Daycare"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                              No Daycare locations found. Try a different
                              search term.
                            </p>
                          ) : (
                            <>
                              <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>No Daycare locations available.</p>
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
                                        {formatDaycarePrice(
                                          daycare.price,
                                          daycare.priceString
                                        )}
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
                  value={formData.contactMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, contactMethod: e.target.value })
                  }
                  disabled={isUpdatingContactLog}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select contact method</option>
                  {CONTACT_METHODS.map((method) => (
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
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  disabled={isUpdatingContactLog}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select purpose</option>
                  {PURPOSES.map((purpose) => (
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
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  disabled={isUpdatingContactLog}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  placeholder="What happened during this contact?"
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.notes.length}/1000 characters
                </p>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome (Optional)
                </label>
                <input
                  type="text"
                  value={formData.outcome}
                  onChange={(e) =>
                    setFormData({ ...formData, outcome: e.target.value })
                  }
                  disabled={isUpdatingContactLog}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter outcome (optional)"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) =>
                    setFormData({ ...formData, followUpDate: e.target.value })
                  }
                  disabled={isUpdatingContactLog}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdatingContactLog}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingContactLog}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingContactLog ? "Updating..." : "Update Contact Log"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

