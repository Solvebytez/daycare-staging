"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ArrowRight } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import Link from "next/link";
import { apiClient } from "../../lib/api";
import MessagingSystem from "../../components/MessagingSystem";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../hooks/useFavorites";
import { useDebounce } from "../../hooks/useDebounce";
import daycaresLocalData from "../../data/daycares.json";
import SearchSummary from "./components/SearchSummary";
import RecentlyViewed from "./components/RecentlyViewed";
import FilterPanel from "./components/FilterPanel";
import SearchResults from "./components/SearchResults";
import ComparisonModal from "./components/ComparisonModal";
import ContactLogModal from "../../components/ContactLogModal";
import {
  saveAutoApplyPending,
  readAutoApplyPending,
  clearAutoApplyPending,
  returnUrlsMatch,
  normalizeSearchSelectionUrl,
  saveSearchSelection,
  readSearchSelection,
  clearSearchSelection,
} from "../../lib/autoApplyPending";
import {
  listUserPurchases,
  reportPurchasedDaycareIdsFromPurchases,
} from "../../lib/paymentsService";
import { getUserApplications } from "../../lib/applicationsService";
import { getAutoApplyBlockedDaycareIds } from "../../lib/autoApplyDuplicateDaycares";

interface Daycare {
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

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const {
    favorites: apiFavorites,
    addFavorite: addFavoriteAPI,
    removeFavorite: removeFavoriteAPI,
    isAddingFavorite,
    isRemovingFavorite,
  } = useFavorites();
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>("");
  const [selectedVacancy, setSelectedVacancy] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState("");
  const [cwelccParticipating, setCwelccParticipating] = useState(false);
  const [acceptsSubsidy, setAcceptsSubsidy] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(
    null
  ); // Track which favorite is loading
  const [compareList, setCompareList] = useState<string[]>([]);
  const [autoApplySelectedIds, setAutoApplySelectedIds] = useState<string[]>(
    []
  );
  const autoApplyHydratedRef = useRef(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasPurchasedReport] = useState(false);
  
  // Results per page: 15 for logged-in users, 4 for guests
  const resultsPerPage = useMemo(() => {
    return user && !authLoading ? 15 : 4;
  }, [user, authLoading]);
  const [recentlyViewed, setRecentlyViewed] = useState<Daycare[]>([]);

  // Search query state
  const [searchQuery, setSearchQuery] = useState("");
  // Debounced search query (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Messaging state
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Daycare | null>(
    null
  );

  // Contact Log Modal state
  const [showContactLogModal, setShowContactLogModal] = useState(false);

  // Filter section states - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<{
    sort: boolean;
    price: boolean;
    type: boolean;
    ageRange: boolean;
    vacancy: boolean;
  }>({
    sort: false,
    price: false,
    type: false,
    ageRange: false,
    vacancy: false,
  });

  // Track if filters have been initialized from URL to prevent loops
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  
  // Track if we're updating URL ourselves to prevent sync loops
  const isUpdatingUrlRef = useRef(false);
  
  // Track initial region to prevent clearing ward on initial load
  const initialRegionRef = useRef<string | null>(null);
  
  // Track previous filter values to detect changes and reset page
  const prevFiltersRef = useRef({
    debouncedSearchQuery: "",
    selectedRegion: "",
    selectedPriceRange: "",
    selectedTypes: [] as string[],
    selectedAgeRange: "",
    selectedVacancy: "",
    selectedWard: "",
    cwelccParticipating: false,
    acceptsSubsidy: false,
    sortBy: "name",
    sortOrder: "asc",
  });

  // Sync filters with URL when URL changes (browser back/forward navigation)
  // This effect only runs when searchParams changes externally (browser navigation)
  useEffect(() => {
    // Don't run during initialization or when we're updating URL ourselves
    // Also add a small delay to ensure initialization completes first
    if (!filtersInitialized || isUpdatingUrlRef.current) {
      return;
    }
    
    const params = searchParams;
    
    
    // Build what the current URL should be based on current state
    const currentParams = new URLSearchParams();
    if (debouncedSearchQuery) currentParams.set("q", debouncedSearchQuery);
    if (selectedRegion) currentParams.set("region", selectedRegion);
    if (selectedPriceRange) currentParams.set("priceRange", selectedPriceRange);
    if (selectedTypes.length > 0) currentParams.set("types", selectedTypes.join(","));
    if (selectedAgeRange) currentParams.set("ageRange", selectedAgeRange);
    if (selectedVacancy) currentParams.set("vacancy", selectedVacancy);
    if (selectedWard) currentParams.set("ward", selectedWard);
    if (cwelccParticipating) currentParams.set("cwelcc", "true");
    if (acceptsSubsidy) currentParams.set("subsidy", "true");
    if (sortBy !== "name") currentParams.set("sortBy", sortBy);
    if (sortOrder !== "asc") currentParams.set("sortOrder", sortOrder);
    if (currentPage > 1) currentParams.set("page", currentPage.toString());
    
    // Only sync if URL actually differs from current state (external navigation)
    // Compare parameter sets (order-independent)
    const currentParamsMap = new Map(currentParams.entries());
    const urlParamsMap = new Map(params.entries());
    
    // Check if they're different
    let paramsDiffer = currentParamsMap.size !== urlParamsMap.size;
    if (!paramsDiffer) {
      for (const [key, value] of currentParamsMap) {
        if (urlParamsMap.get(key) !== value) {
          paramsDiffer = true;
          break;
        }
      }
    }
    
    // Only sync if parameters actually differ
    if (!paramsDiffer) return;
    
    // Sync search query
    const q = params.get("q") || "";
    if (q !== debouncedSearchQuery) {
      setSearchQuery(q);
    }
    
    // Sync region (trim and decode to match initialization behavior)
    const region = params.get("region") || params.get("location") || "";
    if (region) {
      const decodedRegion = decodeURIComponent(region.replace(/\+/g, " ")).trim();
      if (decodedRegion !== selectedRegion) {
        setSelectedRegion(decodedRegion);
      }
    } else if (selectedRegion) {
      // If URL has no region but state has one, clear it
      setSelectedRegion("");
    }
    
    // Sync price range
    const priceRange = params.get("priceRange") || "";
    if (priceRange !== selectedPriceRange && ["low", "medium", "high", ""].includes(priceRange)) {
      setSelectedPriceRange(priceRange);
    }
    
    // Sync types
    const types = params.get("types");
    const typesArray = types ? types.split(",").filter(Boolean) : [];
    if (JSON.stringify(typesArray) !== JSON.stringify(selectedTypes)) {
      setSelectedTypes(typesArray);
    }
    
    // Sync age range
    const ageRange = params.get("ageRange") || "";
    if (ageRange !== selectedAgeRange) {
      setSelectedAgeRange(ageRange);
      // Expand age range section when ageRange is in URL
      if (ageRange) {
        setExpandedSections((prev) => ({ ...prev, ageRange: true }));
      }
    }
    
    // Sync vacancy
    const vacancy = params.get("vacancy") || "";
    if (vacancy !== selectedVacancy) {
      setSelectedVacancy(vacancy);
      // Expand vacancy section when vacancy is in URL and age range is selected
      if (vacancy && ageRange) {
        setExpandedSections((prev) => ({ ...prev, vacancy: true }));
      }
    }
    
    // Sync ward (decode URL-encoded values)
    const ward = params.get("ward") || "";
    if (ward) {
      const decodedWard = decodeURIComponent(ward.replace(/\+/g, " "));
      if (decodedWard !== selectedWard) {
        setSelectedWard(decodedWard);
      }
    } else if (selectedWard) {
      // If URL has no ward but state has one, clear it
      setSelectedWard("");
    }
    
    // Sync boolean filters
    const cwelcc = params.get("cwelcc") === "true";
    if (cwelcc !== cwelccParticipating) {
      setCwelccParticipating(cwelcc);
    }
    
    const subsidy = params.get("subsidy") === "true";
    if (subsidy !== acceptsSubsidy) {
      setAcceptsSubsidy(subsidy);
    }
    
    // Sync sort
    const sortByParam = params.get("sortBy") || "name";
    if (sortByParam !== sortBy) {
      setSortBy(sortByParam);
    }
    
    const sortOrderParam = params.get("sortOrder") || "asc";
    if (sortOrderParam !== sortOrder && ["asc", "desc"].includes(sortOrderParam)) {
      setSortOrder(sortOrderParam);
    }
    
    // Sync page
    const page = params.get("page");
    const pageNum = page ? parseInt(page, 10) : 1;
    if (!isNaN(pageNum) && pageNum > 0 && pageNum !== currentPage) {
      setCurrentPage(pageNum);
    }
  }, [searchParams, filtersInitialized]); // Only depend on searchParams to detect external URL changes (browser navigation)

  // Initialize all filters from URL query parameters on mount
  // This MUST run before any sync effects
  useEffect(() => {
    if (filtersInitialized) {
      return;
    }
    
    // Check if we're returning from a details page and need to restore search URL
    // Only restore if current URL has no parameters (user came back to /search without params)
    const currentUrlHasParams = searchParams.toString().length > 0;
    if (!currentUrlHasParams && typeof window !== "undefined" && window.location.pathname === "/search") {
      try {
        const savedSearchUrl = sessionStorage.getItem("lastSearchUrl");
        if (savedSearchUrl && savedSearchUrl.startsWith("/search") && savedSearchUrl !== "/search") {
          // Restore the saved search URL (only if it's different from current)
          const urlParts = savedSearchUrl.split("?");
          if (urlParts.length > 1) {
            // Has query parameters, restore it
            router.replace(savedSearchUrl);
            // Clear the saved URL after using it
            sessionStorage.removeItem("lastSearchUrl");
            return; // Wait for URL to update before initializing
          }
        }
      } catch {
        // Silent fail
      }
    }
    
    const params = searchParams;
    
    
    // Read search query
    const q = params.get("q");
    if (q) setSearchQuery(q);
    
    // Read region (location or region param) - decode and trim
    const region = params.get("region") || params.get("location");
    if (region) {
      const decodedRegion = decodeURIComponent(region.replace(/\+/g, " ")).trim();
      setSelectedRegion(decodedRegion);
      }
    
    // Read price range
    const priceRange = params.get("priceRange");
    if (priceRange && ["low", "medium", "high"].includes(priceRange)) {
      setSelectedPriceRange(priceRange);
    }
    
    // Read types (comma-separated)
    const types = params.get("types");
    if (types) {
      setSelectedTypes(types.split(",").filter(Boolean));
    }
    
    // Read age range
    const ageRange = params.get("ageRange") || "";
    if (ageRange) {
      setSelectedAgeRange(ageRange);
      // Expand age range section when ageRange is in URL
      setExpandedSections((prev) => ({ ...prev, ageRange: true }));
    }
    
    // Read vacancy
    const vacancy = params.get("vacancy") || "";
    if (vacancy) {
      setSelectedVacancy(vacancy);
      // Expand vacancy section when vacancy is in URL and age range is selected
      if (ageRange) {
        setExpandedSections((prev) => ({ ...prev, vacancy: true }));
      }
    }
    
    // Read ward (decode URL-encoded values like + to spaces)
    const ward = params.get("ward");
    if (ward) {
      // Decode URL-encoded ward name (e.g., "Don+Valley+East" -> "Don Valley East")
      const decodedWard = decodeURIComponent(ward.replace(/\+/g, " "));
      setSelectedWard(decodedWard);
    }
    
    // Read boolean filters - always set (even if false) to ensure UI reflects URL state
    const cwelcc = params.get("cwelcc");
    const cwelccValue = cwelcc === "true";
    setCwelccParticipating(cwelccValue);
    
    const subsidy = params.get("subsidy");
    const subsidyValue = subsidy === "true";
    setAcceptsSubsidy(subsidyValue);
    
    // Read sort
    const sortByParam = params.get("sortBy");
    if (sortByParam) setSortBy(sortByParam);
    
    const sortOrderParam = params.get("sortOrder");
    if (sortOrderParam && ["asc", "desc"].includes(sortOrderParam)) {
      setSortOrder(sortOrderParam);
    }
    
    // Read page
    const page = params.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) setCurrentPage(pageNum);
    }
    
    // Mark as initialized after a small delay to ensure all state updates are processed
    // This prevents the URL update effect from running before filters are set
    setTimeout(() => {
      setFiltersInitialized(true);
    }, 0);
  }, [searchParams, filtersInitialized]);

  // Get favorite IDs from API (only for logged-in users)
  const favorites = useMemo(() => {
    if (user) {
      // For logged-in users, get favorite IDs from API
      return apiFavorites.map(
        (fav) => fav.daycareId || fav.daycare?._id || fav.daycare?.id || ""
      );
    } else {
      // For guest users, no favorites (they need to login)
      return [];
    }
  }, [user, apiFavorites]);

  // Restore search URL from localStorage if user just logged in and URL is empty
  // This is a fallback in case the login page redirect didn't work
  useEffect(() => {
    // Only run on client side and when user is logged in
    if (typeof window === "undefined" || !user || authLoading) return;
    
    // Add a small delay to ensure login redirect has completed first
    const timeoutId = setTimeout(() => {
      // Check if we have a saved search URL and current URL has no search params
      try {
        const savedSearchUrl = localStorage.getItem("searchRedirectUrl");
        const currentUrlHasParams = searchParams.toString().length > 0;
        
        // Only restore if we have a saved URL, current URL has no params, and we're on /search
        if (savedSearchUrl && !currentUrlHasParams && window.location.pathname === "/search") {
          const validatedUrl = validateRedirectUrl(savedSearchUrl);
          if (validatedUrl && validatedUrl.startsWith("/search")) {
            // Clear localStorage before redirecting
            localStorage.removeItem("searchRedirectUrl");
            // Use router.replace to update URL without adding to history
            router.replace(validatedUrl);
          } else {
            // Invalid URL, clear it
            localStorage.removeItem("searchRedirectUrl");
          }
        } else if (savedSearchUrl && currentUrlHasParams) {
          // URL already has params, clear the saved one (redirect worked)
          localStorage.removeItem("searchRedirectUrl");
        }
      } catch {
        // Silent fail
      }
    }, 500); // 500ms delay to let login redirect complete first
    
    return () => clearTimeout(timeoutId);
  }, [user, authLoading, searchParams, router]);

  // Hydrate auto-apply selection: post-login pending first, else sessionStorage for refresh
  useLayoutEffect(() => {
    if (!filtersInitialized || typeof window === "undefined") return;
    const current = normalizeSearchSelectionUrl(
      window.location.pathname + window.location.search
    );

    const pending = readAutoApplyPending();
    if (
      pending &&
      returnUrlsMatch(normalizeSearchSelectionUrl(pending.returnUrl), current)
    ) {
      setAutoApplySelectedIds(pending.selectedDaycareIds);
      window.setTimeout(() => clearAutoApplyPending(), 400);
      autoApplyHydratedRef.current = true;
      return;
    }

    const stored = readSearchSelection();
    if (
      stored &&
      returnUrlsMatch(normalizeSearchSelectionUrl(stored.returnUrl), current)
    ) {
      if (stored.selectedDaycareIds.length > 0) {
        setAutoApplySelectedIds(stored.selectedDaycareIds);
      }
    } else if (
      stored &&
      !returnUrlsMatch(normalizeSearchSelectionUrl(stored.returnUrl), current)
    ) {
      clearSearchSelection();
      setAutoApplySelectedIds([]);
    }

    autoApplyHydratedRef.current = true;
  }, [filtersInitialized, searchParams]);

  // Persist selection across refresh (cleared when URL/filters no longer match or list empty)
  useEffect(() => {
    if (!filtersInitialized || typeof window === "undefined") return;
    if (!autoApplyHydratedRef.current) return;

    const returnUrl = normalizeSearchSelectionUrl(
      window.location.pathname + window.location.search
    );
    if (autoApplySelectedIds.length === 0) {
      clearSearchSelection();
      return;
    }
    saveSearchSelection({
      returnUrl,
      selectedDaycareIds: autoApplySelectedIds,
    });
  }, [autoApplySelectedIds, filtersInitialized]);

  // Helper function to save URL to localStorage reliably
  const saveRedirectUrl = useCallback((url: string): boolean => {
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
    } catch {
      // localStorage might be disabled or full
      return false;
    }
  }, []);

  // Helper function to validate redirect URL (same as in login page)
  const validateRedirectUrl = (url: string): string | null => {
    try {
      const decodedUrl = decodeURIComponent(url);
      if (!decodedUrl.startsWith("/")) return null;
      if (decodedUrl.startsWith("/login") || decodedUrl.startsWith("/register")) return null;
      const fullUrl = new URL(decodedUrl, window.location.origin);
      if (fullUrl.origin !== window.location.origin) return null;
      return fullUrl.pathname + fullUrl.search;
    } catch {
      return null;
    }
  };

  // Reset page to 1 when filters change (except when page itself changes)
  useEffect(() => {
    if (!filtersInitialized) return;
    
    const currentFilters = {
      debouncedSearchQuery,
      selectedRegion,
      selectedPriceRange,
      selectedTypes,
      selectedAgeRange,
      selectedVacancy,
      selectedWard,
      cwelccParticipating,
      acceptsSubsidy,
      sortBy,
      sortOrder,
    };
    
    // Check if any filter (other than page) has changed
    const filtersChanged = 
      prevFiltersRef.current.debouncedSearchQuery !== currentFilters.debouncedSearchQuery ||
      prevFiltersRef.current.selectedRegion !== currentFilters.selectedRegion ||
      prevFiltersRef.current.selectedPriceRange !== currentFilters.selectedPriceRange ||
      JSON.stringify(prevFiltersRef.current.selectedTypes) !== JSON.stringify(currentFilters.selectedTypes) ||
      prevFiltersRef.current.selectedAgeRange !== currentFilters.selectedAgeRange ||
      prevFiltersRef.current.selectedVacancy !== currentFilters.selectedVacancy ||
      prevFiltersRef.current.selectedWard !== currentFilters.selectedWard ||
      prevFiltersRef.current.cwelccParticipating !== currentFilters.cwelccParticipating ||
      prevFiltersRef.current.acceptsSubsidy !== currentFilters.acceptsSubsidy ||
      prevFiltersRef.current.sortBy !== currentFilters.sortBy ||
      prevFiltersRef.current.sortOrder !== currentFilters.sortOrder;
    
    if (filtersChanged && currentPage > 1) {
      setCurrentPage(1);
    }
    
    // Update ref for next comparison
    prevFiltersRef.current = currentFilters;
  }, [
    filtersInitialized,
    debouncedSearchQuery,
    selectedRegion,
    selectedPriceRange,
    selectedTypes,
    selectedAgeRange,
    selectedVacancy,
    selectedWard,
    cwelccParticipating,
    acceptsSubsidy,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  // Update URL when filters change (but not during initial load)
  useEffect(() => {
    if (!filtersInitialized) return;
    
    const params = new URLSearchParams();
    
    // Add search query
    if (debouncedSearchQuery) {
      params.set("q", debouncedSearchQuery);
    }
    
    // Add region
    if (selectedRegion) {
      params.set("region", selectedRegion);
    }
    
    // Add price range
    if (selectedPriceRange) {
      params.set("priceRange", selectedPriceRange);
    }
    
    // Add types
    if (selectedTypes.length > 0) {
      params.set("types", selectedTypes.join(","));
    }
    
    // Add age range
    if (selectedAgeRange) {
      params.set("ageRange", selectedAgeRange);
    }
    
    // Add vacancy
    if (selectedVacancy) {
      params.set("vacancy", selectedVacancy);
    }
    
    // Add ward
    if (selectedWard) {
      params.set("ward", selectedWard);
    }
    
    // Add boolean filters
    if (cwelccParticipating) {
      params.set("cwelcc", "true");
    }
    
    if (acceptsSubsidy) {
      params.set("subsidy", "true");
    }
    
    // Add sort (only if not default)
    if (sortBy !== "name") {
      params.set("sortBy", sortBy);
    }
    if (sortOrder !== "asc") {
      params.set("sortOrder", sortOrder);
    }
    
    // Add page (only if not page 1)
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }
    
    // Build the new URL
    const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
    
    // Only update URL if it's different from current URL
    // This prevents clearing URL params when filters are initialized from URL
    // Compare the parameter sets (order-independent comparison)
    const currentParamsMap = new Map(searchParams.entries());
    const newParamsMap = new Map(params.entries());
    
    let paramsDiffer = currentParamsMap.size !== newParamsMap.size;
    if (!paramsDiffer) {
      for (const [key, value] of newParamsMap) {
        if (currentParamsMap.get(key) !== value) {
          paramsDiffer = true;
          break;
        }
      }
    }
    
    if (paramsDiffer) {
      isUpdatingUrlRef.current = true;
      router.replace(newUrl, { scroll: false });
      
      // Reset flag after a short delay to allow URL to update
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 100);
    }
  }, [
    filtersInitialized,
    debouncedSearchQuery,
    selectedRegion,
    selectedPriceRange,
    selectedTypes,
    selectedAgeRange,
    selectedVacancy,
    selectedWard,
    cwelccParticipating,
    acceptsSubsidy,
    sortBy,
    sortOrder,
    currentPage,
    router,
  ]);

  // Check if user has purchased the full report
  // DISABLED: Purchase check endpoint not available
  // useEffect(() => {
  //   const checkPurchaseStatus = async () => {
  //     if (!user || authLoading) {
  //       setCheckingPurchase(false);
  //       return;
  //     }

  //     try {
  //       // Cookies are sent automatically with axios
  //       const response = await apiClient.get('/api/payments/check-purchase');

  //       if (response.data.success) {
  //         setHasPurchasedReport(response.data.hasPurchased || false);
  //       }
  //     } catch (error) {
  //       console.error("Error checking purchase status:", error);
  //     } finally {
  //       setCheckingPurchase(false);
  //     }
  //   };

  //   checkPurchaseStatus();
  // }, [user, authLoading]);

  // Set checkingPurchase to false immediately since we're not checking
  useEffect(() => {
    // no-op: purchase check disabled
  }, [user, authLoading]);

  // Debounce search query
  // Removed: "Search by name or address" field no longer exists.

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    selectedRegion,
    selectedPriceRange,
    selectedTypes,
    selectedAgeRange,
    selectedVacancy,
    selectedWard,
    cwelccParticipating,
    acceptsSubsidy,
    sortBy,
    sortOrder,
  ]);

  // Vacancy filter commented out for now
  /*
  useEffect(() => {
    if (!selectedAgeRange) {
      if (selectedVacancy.length > 0) setSelectedVacancy([]);
      return;
    }
    setSelectedVacancy(["yes"]);
  }, [selectedAgeRange]);
  */

  const escapeRegex = useCallback((value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }, []);

  // Build query parameters for API (with pagination)
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: currentPage.toString(),
      limit: resultsPerPage.toString(),
    };

    if (debouncedSearchQuery) {
      params.q = debouncedSearchQuery;
    }

    if (selectedRegion) {
      params.region = selectedRegion;
    }

    // Price range
    if (selectedPriceRange) {
      if (selectedPriceRange === "low") {
        params.priceMax = "1200";
      } else if (selectedPriceRange === "medium") {
        params.priceMin = "1201";
        params.priceMax = "1800";
      } else if (selectedPriceRange === "high") {
        params.priceMin = "1801";
      }
    }

    // Type (multi-select) -> backend supports `daycareType` regex filtering.
    // We build a safe alternation regex so selecting multiple types works.
    if (selectedTypes.length > 0) {
      params.daycareType = selectedTypes.map(escapeRegex).join("|");
    }

    // Age range - automatically filters by capacity > 0 (original behavior)
    if (selectedAgeRange) {
      params.ageRange = selectedAgeRange;
      // Automatically set availability=yes (filters by capacity > 0)
      params.availability = "yes";
      
      // Vacancy filter (Yes/No) - only send if explicitly selected
      if (selectedVacancy) {
        params.vacancy = selectedVacancy;
      }
    }

    // Ward
    if (selectedWard) {
      params.ward = selectedWard;
    }

    // CWELCC
    if (cwelccParticipating) {
      params.cwelcc = "true";
    }

    // Subsidy
    if (acceptsSubsidy) {
      params.subsidy = "true";
    }

    return params;
  }, [
    currentPage,
    resultsPerPage,
    debouncedSearchQuery,
    selectedRegion,
    selectedPriceRange,
    selectedTypes,
    selectedAgeRange,
    selectedVacancy,
    selectedWard,
    cwelccParticipating,
    acceptsSubsidy,
    escapeRegex,
  ]);

  // Build query parameters for map view (all results, no pagination)
  const mapQueryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: "1",
      limit: "1000", // Large limit to get all results
    };

    if (debouncedSearchQuery) {
      params.q = debouncedSearchQuery;
    }

    if (selectedRegion) {
      params.region = selectedRegion;
    }

    // Price range
    if (selectedPriceRange) {
      if (selectedPriceRange === "low") {
        params.priceMax = "1200";
      } else if (selectedPriceRange === "medium") {
        params.priceMin = "1201";
        params.priceMax = "1800";
      } else if (selectedPriceRange === "high") {
        params.priceMin = "1801";
      }
    }

    // Type (multi-select)
    if (selectedTypes.length > 0) {
      params.daycareType = selectedTypes.map(escapeRegex).join("|");
    }

    // Age range
    if (selectedAgeRange) {
      params.ageRange = selectedAgeRange;
      // Automatically set availability=yes (filters by capacity > 0)
      params.availability = "yes";
    }

    // Vacancy filter commented out for now
    /*
    if (selectedAgeRange && selectedVacancy.length > 0) {
      params.vacancy = selectedVacancy[0];
    }
    */

    // Ward
    if (selectedWard) {
      params.ward = selectedWard;
    }

    // CWELCC
    if (cwelccParticipating) {
      params.cwelcc = "true";
    }

    // Subsidy
    if (acceptsSubsidy) {
      params.subsidy = "true";
    }

    return params;
  }, [
    debouncedSearchQuery,
    selectedRegion,
    selectedPriceRange,
    selectedTypes,
    selectedAgeRange,
    selectedVacancy,
    selectedWard,
    cwelccParticipating,
    acceptsSubsidy,
    escapeRegex,
  ]);

  // Regions (distinct)
  const { data: regionsResponse } = useQuery({
    queryKey: ["daycares", "regions"],
    queryFn: async () => {
      const response = await apiClient.get("/api/daycares/regions/all");
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - regions rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached longer
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false,
  });

  const regions: string[] = Array.isArray(regionsResponse?.data)
    ? regionsResponse.data
    : Array.isArray(regionsResponse)
    ? regionsResponse
    : [];

  // Cities by region (distinct)
  const { data: citiesResponse } = useQuery({
    queryKey: ["daycares", "citiesByRegion", selectedRegion],
    enabled: !!selectedRegion,
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/daycares/cities/all?region=${encodeURIComponent(selectedRegion)}`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - cities by region rarely change
    gcTime: 20 * 60 * 1000, // 20 minutes - keep cached longer
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false,
  });

  const cityWardOptions: string[] = Array.isArray(citiesResponse?.data)
    ? citiesResponse.data
    : Array.isArray(citiesResponse)
    ? citiesResponse
    : [];

  // Daycare types by region and city (dynamic)
  const { data: typesResponse } = useQuery({
    queryKey: ["daycares", "types", selectedRegion, selectedWard],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRegion) {
        params.append("region", selectedRegion);
      }
      if (selectedWard) {
        params.append("city", selectedWard);
      }
      const response = await apiClient.get(
        `/api/daycares/types/all?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!selectedRegion || !!selectedWard, // Only fetch when region or city is selected
    staleTime: 10 * 60 * 1000, // 10 minutes - types may change but not frequently
    gcTime: 20 * 60 * 1000, // 20 minutes - keep cached longer
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false,
  });

  const availableTypes: string[] = Array.isArray(typesResponse?.data)
    ? typesResponse.data
    : Array.isArray(typesResponse)
    ? typesResponse
    : [];

  // Format types for FilterPanel (convert string array to {value, label} format)
  const typeOptions = useMemo(() => {
    // Helper function to format type label
    const formatTypeLabel = (typeValue: string): string => {
      // Common abbreviations and formatting
      const typeMap: Record<string, string> = {
        Nursery: "Nursery",
        "Regional (Durham) Early Learning and Child Care Centres":
          "Regional (Durham) ELC Centres",
        "Full Day, After-School, PA Day, Summer Camp":
          "Full Day / After-School / Camps",
        "Infant and Toddler Programs, Summer Camp, Preschool Room, Nursery School, School Age Program, Junior & Senior Kindergarten":
          "Infant–School Age Programs",
        "YMCA Childcare": "YMCA Childcare",
        "Umbrella Academy, Before and After School":
          "Umbrella Academy (B&A School)",
        "Afterschool program": "Afterschool Program",
        "BGC Durham, After-School program": "BGC Durham (After-School)",
        "YMCA Before & After School": "YMCA (B&A School)",
        "YMCA School Age": "YMCA (School Age)",
        Montessori: "Montessori",
        Camps: "Camps",
        "Home Childcare": "Home Childcare",
        "Compass ELC": "Compass ELC",
        "Child Care": "Child Care",
        "Before and After School Program": "Before & After School",
        Christian: "Christian",
      };

      return (
        typeMap[typeValue] ||
        (typeValue.length > 40 ? typeValue.substring(0, 37) + "..." : typeValue)
      );
    };

    return availableTypes.map((type) => ({
      value: type,
      label: formatTypeLabel(type),
    }));
  }, [availableTypes]);

  // Reset City/Ward when region changes (but not on initial load from URL)
  useEffect(() => {
    // On initial load, set the initial region ref and don't clear ward
    if (initialRegionRef.current === null) {
      initialRegionRef.current = selectedRegion;
      return;
    }
    
    // Only clear ward if region actually changed (not on initial load)
    // This prevents clearing ward when both region and ward are loaded from URL
    // Also check if filters have been initialized to avoid clearing during URL sync
    if (
      filtersInitialized &&
      initialRegionRef.current !== selectedRegion && 
      selectedRegion !== "" &&
      initialRegionRef.current !== ""
    ) {
      // Region actually changed (user selected different region), clear ward
    setSelectedWard("");
      initialRegionRef.current = selectedRegion;
    } else if (selectedRegion !== "" && initialRegionRef.current !== selectedRegion) {
      // Update the ref even if we don't clear ward (for tracking)
      initialRegionRef.current = selectedRegion;
    }
  }, [selectedRegion, filtersInitialized]);

  // Fetch daycares with React Query
  const {
    data: daycaresResponse,
    isLoading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ["daycares", "search", queryParams],
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams(queryParams);
        const response = await apiClient.get(
          `/api/daycares/search?${searchParams.toString()}`
        );

        if (response.data.success) {
          return response.data;
        } else {
          throw new Error("Invalid data format received");
        }
      } catch {
        // Fallback to local data if API fails
        // For fallback, we'll return a mock response structure
        const filtered = (daycaresLocalData as Daycare[]).slice(
          (currentPage - 1) * resultsPerPage,
          currentPage * resultsPerPage
        );
        return {
          success: true,
          data: filtered,
          metadata: {
            pagination: {
              currentPage,
              totalPages: Math.ceil(
                (daycaresLocalData as Daycare[]).length / resultsPerPage
              ),
              totalCount: (daycaresLocalData as Daycare[]).length,
              limit: resultsPerPage,
              hasNextPage:
                currentPage <
                Math.ceil(
                  (daycaresLocalData as Daycare[]).length / resultsPerPage
                ),
              hasPreviousPage: currentPage > 1,
            },
          },
        };
      }
    },
    // Keep showing the previous page of results while new filters load.
    // This prevents the whole page from flashing/going blank on every filter change.
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    gcTime: 10 * 60 * 1000, // 10 minutes - keep cached data longer (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if we have cached data
  });

  // Fetch all daycares for map view (only if user is logged in)
  const { data: allDaycaresResponse } = useQuery({
    queryKey: ["daycares", "search", "all", mapQueryParams],
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams(mapQueryParams);
        const response = await apiClient.get(
          `/api/daycares/search?${searchParams.toString()}`
        );

        if (response.data.success) {
          return response.data;
        } else {
          throw new Error("Invalid data format received");
        }
      } catch {
        return {
          success: true,
          data: [],
          metadata: {
            pagination: {
              totalCount: 0,
            },
          },
        };
      }
    },
    enabled: !!user && !authLoading, // Only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep cached longer
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false,
  });

  const { data: purchasesForReportBadges = [] } = useQuery({
    queryKey: ["payments", "purchases", "reportBadges", user?._id],
    queryFn: async () => {
      const res = await listUserPurchases({
        status: "completed",
        limit: 200,
        skip: 0,
      });
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    enabled: Boolean(user && !authLoading),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const purchasedReportDaycareIds = useMemo(
    () => reportPurchasedDaycareIdsFromPurchases(purchasesForReportBadges),
    [purchasesForReportBadges]
  );

  const { data: myApplicationsForAutoApply } = useQuery({
    queryKey: ["userApplications", "autoApplyBlocks", user?._id],
    queryFn: () => getUserApplications(),
    enabled: Boolean(user && !authLoading),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const blockedAutoApplyDaycareIds = useMemo(() => {
    if (
      !myApplicationsForAutoApply?.success ||
      !Array.isArray(myApplicationsForAutoApply.data)
    ) {
      return new Set<string>();
    }
    return getAutoApplyBlockedDaycareIds(myApplicationsForAutoApply.data);
  }, [myApplicationsForAutoApply]);

  // Extract data from query response
  const daycaresData = useMemo(() => {
    const data = daycaresResponse?.data || [];
    // Transform API response: map _id to id (MongoDB returns _id, but frontend expects id)
    // v15.0.0 - include slug for SEO-friendly URLs
    const transformedData = data.map((daycare: { _id?: string; id?: string; slug?: string }) => ({
      ...daycare,
      id: daycare._id || daycare.id || "",
      slug: daycare.slug || daycare._id || daycare.id || "", // v15.0.0 - Use slug if available, fallback to id
    }));
    return transformedData;
  }, [daycaresResponse?.data]);
  const paginationMeta = daycaresResponse?.metadata?.pagination;
  const totalPages = paginationMeta?.totalPages || 1;
  const totalCount = paginationMeta?.totalCount || 0;

  // Helper function for price parsing
  const getPriceValue = useCallback((price: string | undefined | null) => {
    if (!price || typeof price !== "string") return 0;
    const numericPrice = price.replace(/[^0-9]/g, "");
    return numericPrice ? parseInt(numericPrice) : 0;
  }, []);

  // Sort daycares (backend handles filtering, we only sort client-side)
  const sortedDaycares = useMemo(() => {
    if (!daycaresData || !Array.isArray(daycaresData)) {
      return [];
    }

    // Create a copy to avoid mutating the original array
    const sorted = [...daycaresData];

    sorted.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue =
            a.name && typeof a.name === "string" ? a.name.toLowerCase() : "";
          bValue =
            b.name && typeof b.name === "string" ? b.name.toLowerCase() : "";
          break;
        case "rating":
          aValue = parseFloat(a.rating?.toString() || "0");
          bValue = parseFloat(b.rating?.toString() || "0");
          break;
        case "price":
          aValue = getPriceValue(a.price);
          bValue = getPriceValue(b.price);
          break;
        case "distance":
          aValue = parseFloat(a.distance?.toString() || "0");
          bValue = parseFloat(b.distance?.toString() || "0");
          break;
        default:
          aValue =
            a.name && typeof a.name === "string" ? a.name.toLowerCase() : "";
          bValue =
            b.name && typeof b.name === "string" ? b.name.toLowerCase() : "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [daycaresData, sortBy, sortOrder, getPriceValue]);

  // Guest users see only 4 results
  // Logged-in users see 15 results per page (backend pagination)
  const isGuest = !user && !authLoading;
  const guestLimit = 3;
  const maxResults = isGuest ? guestLimit : resultsPerPage;

  // Use sorted daycares as displayed daycares (backend already paginated)
  // Limit results for guests client-side only
  const displayedDaycares = useMemo(() => {
    if (isGuest) {
      return sortedDaycares.slice(0, guestLimit);
    }
    // For logged-in users, backend pagination handles the limit (15 per page)
    return sortedDaycares;
  }, [sortedDaycares, isGuest, guestLimit]);

  // All daycares for map view (logged in users only)
  const allDaycaresForMap = useMemo(() => {
    if (!user || authLoading) {
      return displayedDaycares; // For guests, use displayed daycares
    }
    const mapData = allDaycaresResponse?.data || [];
    // Transform API response: map _id to id (MongoDB returns _id, but frontend expects id)
    const transformedMapData = mapData.map((daycare: { _id?: string; id?: string; slug?: string }) => ({
      ...daycare,
      id: daycare._id || daycare.id || "",
      slug: daycare.slug || daycare._id || daycare.id || "", // v15.0.0 - include slug
    }));
    return transformedMapData.length > 0 ? transformedMapData : displayedDaycares;
  }, [user, authLoading, allDaycaresResponse?.data, displayedDaycares]);

  // Note: Backend pagination is handled via queryParams, but we still need to limit
  // results for guest/free users client-side if needed
  const hasMoreResults = totalCount > maxResults;

  // Pagination functions
  const goToPage = (page: number) => {
    // If guest user, redirect to login instead of changing page
    if (isGuest) {
      const currentUrl = window.location.pathname + window.location.search;
      // Save search URL to localStorage as backup
      saveRedirectUrl(currentUrl);
      // Redirect - redirect parameter in URL is primary, localStorage is backup
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const toggleFavorite = useCallback(
    (id: string) => {
      if (user) {
        // For logged-in users, use API
        setFavoriteLoadingId(id);
        if (favorites.includes(id)) {
          removeFavoriteAPI(id);
        } else {
          addFavoriteAPI(id);
        }
      } else {
        // For guest users, redirect to login
        const currentUrl = window.location.pathname + window.location.search;
        // Save search URL to localStorage as backup
        saveRedirectUrl(currentUrl);
        // Redirect - redirect parameter in URL is primary, localStorage is backup
        window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      }
    },
    [user, favorites, addFavoriteAPI, removeFavoriteAPI]
  );

  // Clear loading state when mutations complete
  useEffect(() => {
    if (!isAddingFavorite && !isRemovingFavorite && favoriteLoadingId) {
      // Small delay to ensure UI updates smoothly
      const timer = setTimeout(() => {
        setFavoriteLoadingId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAddingFavorite, isRemovingFavorite, favoriteLoadingId]);

  const toggleCompare = (id: string) => {
    const newCompareList = compareList.includes(id)
      ? compareList.filter((comp) => comp !== id)
      : [...compareList, id];

    setCompareList(newCompareList);
  };

  const toggleAutoApplySelect = useCallback(
    (id: string) => {
      const normalized = String(id).trim();
      setAutoApplySelectedIds((prev) => {
        const isSelected = prev.some((x) => String(x).trim() === normalized);
        if (isSelected) {
          return prev.filter((x) => String(x).trim() !== normalized);
        }
        if (user && blockedAutoApplyDaycareIds.has(normalized)) {
          toast.error(
            "You already have a pending or accepted application for this daycare. Choose another location.",
            { duration: 4500 }
          );
          return prev;
        }
        return [...prev, id];
      });
    },
    [user, blockedAutoApplyDaycareIds]
  );

  useEffect(() => {
    if (!user || blockedAutoApplyDaycareIds.size === 0) return;
    if (!autoApplyHydratedRef.current) return;
    setAutoApplySelectedIds((prev) => {
      const next = prev.filter(
        (x) => !blockedAutoApplyDaycareIds.has(String(x).trim())
      );
      if (next.length < prev.length) {
        toast("Removed daycares you already applied to from your selection.", {
          icon: "ℹ️",
          duration: 4500,
        });
      }
      return next;
    });
  }, [user, blockedAutoApplyDaycareIds]);

  const clearComparison = () => {
    setCompareList([]);
    setShowComparison(false);
  };

  const getDaycaresToCompare = () => {
    return compareList
      .map((id) => daycaresData.find((daycare: Daycare) => daycare.id === id))
      .filter(Boolean) as Daycare[];
  };

  const handleContactProvider = (daycare: Daycare) => {
    setSelectedProvider(daycare);
    setShowMessaging(true);
  };

  // Handle add contact log - check auth first
  const handleAddContactLog = useCallback(() => {
    if (!user || authLoading) {
      // Guest user - save URL and redirect to login
      const currentUrl = window.location.pathname + window.location.search;
      // Save search URL to localStorage as backup
      saveRedirectUrl(currentUrl);
      // Redirect - redirect parameter in URL is primary, localStorage is backup
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }
    // Logged in user - open modal
    setShowContactLogModal(true);
  }, [user, authLoading, saveRedirectUrl]);

  const handleAutoApplyClick = useCallback(() => {
    const persistedIds = readSearchSelection()?.selectedDaycareIds || [];
    const idsToSend = [...new Set([...autoApplySelectedIds, ...persistedIds])]
      .map((id) => String(id).trim())
      .filter(Boolean)
      .filter((id) => !blockedAutoApplyDaycareIds.has(id));

    if (idsToSend.length === 0) {
      toast.error(
        "No new daycares to apply to — your selection only includes locations you already applied to.",
        { duration: 5000 }
      );
      return;
    }
    if (authLoading) return;
    const returnUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/search";

    if (user) {
      const selectedIdsParam = encodeURIComponent(idsToSend.join(","));
      router.push(`/parent-details?selectedIds=${selectedIdsParam}`);
      return;
    }

    saveAutoApplyPending({
      returnUrl,
      selectedDaycareIds: idsToSend,
    });
    saveRedirectUrl(returnUrl);
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  }, [
    autoApplySelectedIds,
    blockedAutoApplyDaycareIds,
    user,
    authLoading,
    router,
    saveRedirectUrl,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMessageProvider = (daycare: Daycare) => {
    setSelectedProvider(daycare);
    setShowMessaging(true);
  };

  const handleViewDetails = (daycare: Daycare) => {
    // Save current search URL to sessionStorage before navigating
    // This allows us to restore it when user clicks back
    const currentSearchUrl = window.location.pathname + window.location.search;
    try {
      sessionStorage.setItem("lastSearchUrl", currentSearchUrl);
    } catch {
      // Silent fail - will rely on browser history
    }
    // Use Next.js router to preserve browser history (v15.0.0 - use slug for SEO)
    const slug = (daycare as { slug?: string; id: string }).slug || daycare.id;
    router.push(`/daycare/${slug}`);
  };

  const addToRecentlyViewed = (daycare: Daycare) => {
    const recentlyViewed = JSON.parse(
      localStorage.getItem("recently-viewed") || "[]"
    );
    const updated = [
      daycare,
      ...recentlyViewed.filter((d: Daycare) => d.id !== daycare.id),
    ].slice(0, 5);
    localStorage.setItem("recently-viewed", JSON.stringify(updated));
    // update UI immediately
    setRecentlyViewed(updated);
  };

  // Load recently viewed from localStorage (client-side only).
  // Client Components still render on the server for the initial HTML, so
  // we must not touch `localStorage` during render.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("recently-viewed") || "[]";
      const parsed = JSON.parse(raw) as Daycare[];
      setRecentlyViewed(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  // Keep recently viewed in sync with current results dataset
  const filteredRecentlyViewed = useMemo(() => {
    return recentlyViewed.filter((daycare: Daycare) =>
      daycaresData.some((d: Daycare) => d.id === daycare.id)
    );
  }, [recentlyViewed, daycaresData]);

  // Show page structure immediately, use cached data if available
  // Only show loading indicator in results area when fetching

  if (queryError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-red-100 to-red-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-red-500 text-5xl">⚠️</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Error Loading Data
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              {queryError instanceof Error
                ? queryError.message
                : "An error occurred while loading KinderBridge locations"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Reset to first page when searching
              setCurrentPage(1);
            }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 mb-6"
          >
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Find Your Perfect Daycare
              </h1>
              <p className="text-sm text-gray-600">
                Search through our verified network of childcare providers
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search daycares, features, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Reset to first page when typing
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm transition-all duration-200 hover:shadow-md"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Search Daycares
              </button>
            </div>
          </form>

          {/* Back Navigation */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Search Summary Bar */}
          <SearchSummary
            isLoading={isLoading}
            totalCount={totalCount}
            favoritesCount={
              user
                ? apiFavorites.filter((fav) => fav.daycare).length
                : 0
            }
            compareListCount={compareList.length}
            compareListLength={compareList.length}
            onShowComparison={() => setShowComparison(true)}
          />

          {/* Floating Compare Button */}
          {compareList.length > 0 && (
            <div
              className={`fixed right-6 z-40 transition-[top] duration-300 ${
                autoApplySelectedIds.length > 0 ? "top-40" : "top-24"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowComparison(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors flex items-center space-x-2"
              >
                <Filter className="h-5 w-5" />
                <span>Compare ({compareList.length})</span>
              </button>
            </div>
          )}

          {autoApplySelectedIds.length > 0 && (
            <div className="pointer-events-none fixed right-6 top-24 z-50">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md">
                <p className="text-sm font-bold text-gray-800">
                  {autoApplySelectedIds.length} selected
                </p>
                <button
                  type="button"
                  onClick={handleAutoApplyClick}
                  disabled={authLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Auto-Apply
                  <span className="sr-only">
                    to {autoApplySelectedIds.length}{" "}
                    {autoApplySelectedIds.length === 1 ? "Daycare" : "Daycares"}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>
            </div>
          )}

          {/* Recently Viewed Section */}
          <RecentlyViewed
            recentlyViewed={filteredRecentlyViewed}
            onViewDetails={handleViewDetails}
          />

          <div className="flex flex-col lg:flex-row lg:space-x-6">
            {/* Filter Panel */}
            <div className="lg:w-[480px] mb-6 lg:mb-0">
              <FilterPanel
                isLoading={isLoading}
                regions={regions}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                cityWardOptions={cityWardOptions}
                selectedPriceRange={selectedPriceRange}
                setSelectedPriceRange={setSelectedPriceRange}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                selectedAgeRange={selectedAgeRange}
                setSelectedAgeRange={setSelectedAgeRange}
                selectedVacancy={selectedVacancy}
                setSelectedVacancy={setSelectedVacancy}
                selectedWard={selectedWard}
                setSelectedWard={setSelectedWard}
                cwelccParticipating={cwelccParticipating}
                setCwelccParticipating={setCwelccParticipating}
                acceptsSubsidy={acceptsSubsidy}
                setAcceptsSubsidy={setAcceptsSubsidy}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                displayedDaycaresLength={displayedDaycares.length}
                onAddContactLog={handleAddContactLog}
                typeOptions={
                  selectedRegion || selectedWard ? typeOptions : undefined
                }
              />
            </div>

            {/* Main Content Area */}
            <SearchResults
              isLoading={isLoading}
              isFetching={isFetching}
              displayedDaycares={displayedDaycares}
              allDaycaresForMap={allDaycaresForMap}
              totalCount={totalCount}
              totalPages={totalPages}
              currentPage={currentPage}
              isGuest={isGuest}
              hasPurchasedReport={hasPurchasedReport}
              hasMoreResults={hasMoreResults}
              compareList={compareList}
              favorites={favorites}
              favoriteLoadingId={favoriteLoadingId}
              onToggleCompare={toggleCompare}
              onToggleFavorite={toggleFavorite}
              onViewDetails={handleViewDetails}
              onAddToRecentlyViewed={addToRecentlyViewed}
              onPageChange={goToPage}
              onPreviousPage={goToPreviousPage}
              onNextPage={goToNextPage}
              autoApplySelectedIds={autoApplySelectedIds}
              autoApplyBlockedDaycareIds={blockedAutoApplyDaycareIds}
              purchasedReportDaycareIds={purchasedReportDaycareIds}
              onToggleAutoApplySelect={toggleAutoApplySelect}
            />
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={showComparison}
        daycares={getDaycaresToCompare()}
        onClose={() => setShowComparison(false)}
        onClearComparison={clearComparison}
        onContactProvider={handleContactProvider}
      />

      {/* Messaging System Modal */}
      {showMessaging && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh]">
            <MessagingSystem
              currentUserId="demo-user-123"
              currentUserType="parent"
              recipientId={selectedProvider.id}
              recipientType="provider"
              recipientName={selectedProvider.name}
              onClose={() => {
                setShowMessaging(false);
                setSelectedProvider(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Contact Log Modal */}
      <ContactLogModal
        isOpen={showContactLogModal}
        onClose={() => setShowContactLogModal(false)}
      />

      <Toaster position="top-center" toastOptions={{ duration: 4500 }} />
    </>
  );
}

// Loading fallback component
function SearchPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading search page...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export wrapped component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
