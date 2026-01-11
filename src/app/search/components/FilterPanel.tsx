"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Video,
  MessageSquare,
  User,
  ArrowRight,
} from "lucide-react";
import { useContactLogs } from "@/hooks/useContactLogs";
import { useAuth } from "@/contexts/AuthContext";

interface FilterPanelProps {
  isLoading: boolean;
  regions: string[];
  selectedRegion: string;
  setSelectedRegion: (value: string) => void;
  cityWardOptions: string[];
  selectedPriceRange: string;
  setSelectedPriceRange: (value: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (value: string[] | ((prev: string[]) => string[])) => void;
  selectedAgeRange: string;
  setSelectedAgeRange: (value: string) => void;
  selectedAvailability: string[];
  setSelectedAvailability: (
    value: string[] | ((prev: string[]) => string[])
  ) => void;
  selectedWard: string;
  setSelectedWard: (value: string) => void;
  cwelccParticipating: boolean;
  setCwelccParticipating: (value: boolean) => void;
  acceptsSubsidy: boolean;
  setAcceptsSubsidy: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  expandedSections: {
    sort: boolean;
    price: boolean;
    type: boolean;
    ageRange: boolean;
    availability: boolean;
  };
  setExpandedSections: (
    value:
      | {
          sort: boolean;
          price: boolean;
          type: boolean;
          ageRange: boolean;
          availability: boolean;
        }
      | ((prev: {
          sort: boolean;
          price: boolean;
          type: boolean;
          ageRange: boolean;
          availability: boolean;
        }) => {
          sort: boolean;
          price: boolean;
          type: boolean;
          ageRange: boolean;
          availability: boolean;
        })
  ) => void;
  displayedDaycaresLength: number;
  onAddContactLog?: () => void;
  typeOptions?: Array<{ value: string; label: string }>;
}

export default function FilterPanel({
  isLoading,
  regions,
  selectedRegion,
  setSelectedRegion,
  cityWardOptions,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedTypes,
  setSelectedTypes,
  selectedAgeRange,
  setSelectedAgeRange,
  selectedAvailability,
  setSelectedAvailability,
  selectedWard,
  setSelectedWard,
  cwelccParticipating,
  setCwelccParticipating,
  acceptsSubsidy,
  setAcceptsSubsidy,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  expandedSections,
  setExpandedSections,
  displayedDaycaresLength,
  onAddContactLog,
  typeOptions,
}: FilterPanelProps) {
  const { user, isLoading: authLoading } = useAuth();
  // Fetch contact logs (only for logged-in users)
  const { contactLogs, isLoading: isLoadingContactLogs } = useContactLogs();

  // Get latest 3 contact logs
  const latestContactLogs = useMemo(() => {
    return contactLogs.slice(0, 3);
  }, [contactLogs]);

  // Get icon for contact method
  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "Phone Call":
        return <Phone className="h-4 w-4" />;
      case "Email":
        return <Mail className="h-4 w-4" />;
      case "Video Call":
        return <Video className="h-4 w-4" />;
      case "Text Message":
        return <MessageSquare className="h-4 w-4" />;
      case "In-Person Visit":
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${
      months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };
  // Default static type options (used when no region/city is selected)
  const DEFAULT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "Nursery", label: "Nursery" },
    {
      value: "Regional (Durham) Early Learning and Child Care Centres",
      label: "Regional (Durham) ELC Centres",
    },
    {
      value: "Full Day, After-School, PA Day, Summer Camp",
      label: "Full Day / After-School / Camps",
    },
    {
      value:
        "Infant and Toddler Programs, Summer Camp, Preschool Room, Nursery School, School Age Program, Junior & Senior Kindergarten",
      label: "Infant–School Age Programs",
    },
    { value: "YMCA Childcare", label: "YMCA Childcare" },
    {
      value: "Umbrella Academy, Before and After School",
      label: "Umbrella Academy (B&A School)",
    },
    { value: "Afterschool program", label: "Afterschool Program" },
    {
      value: "BGC Durham, After-School program",
      label: "BGC Durham (After-School)",
    },
    { value: "YMCA Before & After School", label: "YMCA (B&A School)" },
    { value: "YMCA School Age", label: "YMCA (School Age)" },
    { value: "Montessori", label: "Montessori" },
    { value: "Camps", label: "Camps" },
    { value: "Home Childcare", label: "Home Childcare" },
    { value: "Compass ELC", label: "Compass ELC" },
    { value: "Child Care", label: "Child Care" },
    {
      value: "Before and After School Program",
      label: "Before & After School",
    },
    { value: "Christian", label: "Christian" },
  ];

  // Helper function to format type string to label
  const formatTypeLabel = (typeValue: string): string => {
    // Try to find a matching label from default options for better formatting
    const defaultOption = DEFAULT_TYPE_OPTIONS.find(
      (opt) => opt.value === typeValue
    );
    if (defaultOption) {
      return defaultOption.label;
    }
    // If no match, return a shortened version of the type value
    if (typeValue.length > 40) {
      return typeValue.substring(0, 37) + "...";
    }
    return typeValue;
  };

  // Use dynamic typeOptions if provided, otherwise use default static options
  const TYPE_OPTIONS =
    typeOptions && typeOptions.length > 0
      ? typeOptions.map((type) => ({
          value: type.value,
          label: type.label || formatTypeLabel(type.value),
        }))
      : DEFAULT_TYPE_OPTIONS;

  const toggleSection = useCallback(
    (section: keyof typeof expandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    [setExpandedSections]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedPriceRange("");
    setSelectedTypes([]);
    setSelectedAgeRange("");
    setSelectedAvailability([]);
    setSelectedWard("");
    setCwelccParticipating(false);
    setAcceptsSubsidy(false);
    setSortBy("name");
    setSortOrder("asc");
  }, [
    setSelectedPriceRange,
    setSelectedTypes,
    setSelectedAgeRange,
    setSelectedAvailability,
    setSelectedWard,
    setCwelccParticipating,
    setAcceptsSubsidy,
    setSortBy,
    setSortOrder,
  ]);

  if (isLoading && displayedDaycaresLength === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 sticky top-8 animate-pulse">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-6">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
              <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 sticky top-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              setExpandedSections({
                sort: false,
                price: false,
                type: false,
                ageRange: false,
                availability: false,
              })
            }
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={() =>
              setExpandedSections({
                sort: true,
                price: true,
                type: true,
                ageRange: true,
                availability: true,
              })
            }
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Search Filters Card Group - Always Open */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Filters
          </h3>

          {/* Region */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <div className="relative">
              <select
                value={selectedRegion || ""}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white ${
                  selectedRegion ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <option value="">Select region</option>
                {/* Always show the selected region value even if regions haven't loaded yet */}
                {selectedRegion && !regions.includes(selectedRegion) && (
                  <option
                    key={`selected-${selectedRegion}`}
                    value={selectedRegion}
                  >
                    {selectedRegion}
                  </option>
                )}
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* City/Ward Dropdown (depends on Region) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City/Ward
            </label>
            <div className="relative">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white ${
                  selectedWard ? "text-gray-900" : "text-gray-400"
                }`}
                disabled={!selectedRegion}
              >
                <option value="">
                  {selectedRegion ? "Select city/ward" : "Select region first"}
                </option>
                {/* Always show the selected ward value even if options haven't loaded yet */}
                {/* This ensures the select shows the value immediately, even before options load */}
                {selectedWard && !cityWardOptions.includes(selectedWard) && (
                  <option key={`selected-${selectedWard}`} value={selectedWard}>
                    {selectedWard}
                  </option>
                )}
                {cityWardOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cwelccParticipating}
                onChange={(e) => setCwelccParticipating(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                CWELCC participating
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptsSubsidy}
                onChange={(e) => setAcceptsSubsidy(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Accepts subsidy</span>
            </label>
          </div>
        </div>
      </div>

      {/* Age Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("ageRange")}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
            Age Range
          </h3>
          {expandedSections.ageRange ? (
            <ChevronUp className="h-5 w-5 text-gray-500 group-hover:text-pink-600 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-pink-600 transition-colors" />
          )}
        </button>
        {expandedSections.ageRange && (
          <div className="mt-4 space-y-3 pl-4">
            {/* IMPORTANT: values must match DB values exactly for filtering to work */}
            {[
              { value: "Infants", label: "Infants (0-18 months)" },
              { value: "Toddlers", label: "Toddlers (18 months - 3 years)" },
              { value: "Preschool", label: "Preschool (3-5 years)" },
              { value: "School Age", label: "School-Age (5-12 years)" },
            ].map((range) => (
              <label
                key={range.value}
                className="flex items-center space-x-3 cursor-pointer group hover:bg-pink-50 p-2 rounded-lg transition-colors"
              >
                <input
                  type="radio"
                  name="ageRange"
                  value={range.value}
                  checked={selectedAgeRange === range.value}
                  onChange={(e) => {
                    setSelectedAgeRange(e.target.value);
                  }}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <span className="text-gray-700 group-hover:text-pink-700 transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("availability")}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
            Availability
          </h3>
          {expandedSections.availability ? (
            <ChevronUp className="h-5 w-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
          )}
        </button>
        {expandedSections.availability && (
          <div className="mt-4 space-y-3 pl-4">
            {!selectedAgeRange && (
              <p className="text-xs text-gray-500">
                Select an age range first to enable availability.
              </p>
            )}
            {/* Yes/No radios map to vacancy filter (cascade with Age Range) */}
            {[
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                  !selectedAgeRange
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer group hover:bg-indigo-50"
                }`}
              >
                <input
                  type="radio"
                  name="availabilityStatus"
                  value={opt.value}
                  checked={selectedAvailability.includes(opt.value)}
                  onChange={() => setSelectedAvailability([opt.value])}
                  disabled={!selectedAgeRange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-gray-700 group-hover:text-indigo-700 transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
            {selectedAvailability.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAvailability([])}
                disabled={!selectedAgeRange}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Clear availability
              </button>
            )}
          </div>
        )}
      </div>

      {/* Type */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("type")}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
            Type
          </h3>
          {expandedSections.type ? (
            <ChevronUp className="h-5 w-5 text-gray-500 group-hover:text-orange-600 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-orange-600 transition-colors" />
          )}
        </button>
        {expandedSections.type && (
          <div className="mt-4 space-y-3 pl-4">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center space-x-3 cursor-pointer group hover:bg-orange-50 p-2 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTypes([...selectedTypes, opt.value]);
                    } else {
                      setSelectedTypes(
                        selectedTypes.filter((t) => t !== opt.value)
                      );
                    }
                  }}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 group-hover:text-orange-700 transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Price Range
          </h3>
          {expandedSections.price ? (
            <ChevronUp className="h-5 w-5 text-gray-500 group-hover:text-purple-600 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-purple-600 transition-colors" />
          )}
        </button>
        {expandedSections.price && (
          <div className="mt-4 space-y-3 pl-4">
            {[
              { value: "low", label: "Under $1,200/month" },
              { value: "medium", label: "$1,200 - $1,800/month" },
              { value: "high", label: "Over $1,800/month" },
            ].map((range) => (
              <label
                key={range.value}
                className="flex items-center space-x-3 cursor-pointer group hover:bg-purple-50 p-2 rounded-lg transition-colors"
              >
                <input
                  type="radio"
                  name="priceRange"
                  value={range.value}
                  checked={selectedPriceRange === range.value}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span className="text-gray-700 group-hover:text-purple-700 transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sort & Order */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("sort")}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Sort & Order
          </h3>
          {expandedSections.sort ? (
            <ChevronUp className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
          )}
        </button>
        {expandedSections.sort && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-4 space-y-4 pl-4 overflow-hidden"
          >
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Sort by:
              </h4>
              {["name", "rating", "price", "distance"].map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-3 cursor-pointer group hover:bg-blue-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={option}
                    checked={sortBy === option}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 capitalize group-hover:text-blue-700 transition-colors">
                    {option}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Order:</h4>
              {["asc", "desc"].map((order) => (
                <label
                  key={order}
                  className="flex items-center space-x-3 cursor-pointer group hover:bg-blue-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="radio"
                    name="sortOrder"
                    value={order}
                    checked={sortOrder === order}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 capitalize group-hover:text-blue-700 transition-colors">
                    {order === "asc" ? "Low to High" : "High to Low"}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Contact Log Card Group - Always visible for all users */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Log
              </h3>
            </div>
            {user && !authLoading && (
              <button
                onClick={onAddContactLog}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-blue-500 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Add Log
              </button>
            )}
          </div>

          {/* Show different content based on login status */}
          {!user || authLoading ? (
            /* Not logged in - Show login prompt */
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText
                  className="h-16 w-16 text-gray-300"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Track your daycare communications
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Sign in to start logging your contacts with daycares
              </p>
              <button
                onClick={() => {
                  const currentUrl =
                    window.location.pathname + window.location.search;
                  // Save to localStorage as backup (redirect parameter in URL is primary)
                  try {
                    localStorage.setItem("searchRedirectUrl", currentUrl);
                    // Verify save worked
                    if (
                      localStorage.getItem("searchRedirectUrl") !== currentUrl
                    ) {
                      localStorage.setItem("searchRedirectUrl", currentUrl);
                    }
                  } catch (error) {
                    // localStorage might be disabled - redirect parameter will still work
                  }
                  // Redirect immediately - localStorage.setItem is synchronous
                  window.location.href = `/login?redirect=${encodeURIComponent(
                    currentUrl
                  )}`;
                }}
                className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign In to Continue
              </button>
            </div>
          ) : isLoadingContactLogs ? (
            /* Logged in - Loading state */
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div>
              <p className="text-xs text-gray-500 mt-2">
                Loading contact logs...
              </p>
            </div>
          ) : latestContactLogs.length === 0 ? (
            /* Logged in - Empty state */
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText
                  className="h-16 w-16 text-gray-300"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                No contacts logged yet
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Start tracking your daycare communications
              </p>
              <button
                onClick={onAddContactLog}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Log First Contact
              </button>
            </div>
          ) : (
            /* Logged in - Show contact logs */
            <div className="space-y-3">
              {latestContactLogs.map((log) => (
                <div
                  key={log._id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-green-500 hover:shadow-sm transition-all bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="text-green-600 flex-shrink-0">
                        {getContactMethodIcon(log.contactMethod)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {log.daycare?.name || "KinderBridge"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {log.contactMethod} • {log.purpose}
                        </p>
                      </div>
                    </div>
                  </div>

                  {log.daycare?.city && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{log.daycare.city}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                    {log.notes}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {log.followUpDate ? (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Follow up: {formatDate(log.followUpDate)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Contacted: {formatDate(log.createdAt)}</span>
                      </div>
                    )}
                    {log.outcome && (
                      <span className="text-green-600 font-medium truncate ml-2">
                        {log.outcome}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {contactLogs.length > 3 && (
                <p className="text-xs text-center text-gray-500 pt-2 mb-3">
                  Showing latest 3 of {contactLogs.length} contact logs
                </p>
              )}

              {/* View All Button */}
              <Link
                href="/parent/dashboard?tab=applications"
                className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
