"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useContactLogs } from "@/hooks/useContactLogs";
import { useApplications } from "@/hooks/useApplications";
import { useEnrollments } from "@/hooks/useEnrollments";
import {
  enrollmentChildDisplayName,
  enrollmentDaycareDisplayName,
} from "@/lib/enrollmentDisplay";
import { getEnrollmentQueueStatus } from "@/lib/enrollmentsService";
import EnrollmentStatusBadge from "@/components/enrollment/EnrollmentStatusBadge";
import Navigation from "@/components/Navigation";
import ContactLogDetailsModal from "@/components/ContactLogDetailsModal";
import EditContactLogModal from "@/components/EditContactLogModal";
import { ContactLogResponse } from "@/lib/contactLogsService";
import { formatDaycarePrice } from "@/utils/priceFormatter";
import toast, { Toaster } from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface SavedSearch {
  id: string;
  name: string;
  location: string;
  price: string;
  image: string;
  status: "available" | "waitlist" | "full";
}

interface Application {
  id: string | number;
  contactLogId?: string; // Contact log ID for direct lookup
  daycareName: string;
  location: string;
  price: string;
  image: string;
  status: "pending" | "accepted" | "rejected";
  appliedDate: string;
  hasFollowUpDate?: boolean; // Flag to indicate if we're showing followup date
}

export default function ParentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    favorites,
    isLoading: favoritesLoading,
    error: favoritesError,
    removeFavorite,
    isRemovingFavorite,
  } = useFavorites();

  const {
    contactLogs,
    isLoading: contactLogsLoading,
    error: contactLogsError,
    deleteContactLog,
    isDeletingContactLog,
  } = useContactLogs();

  const {
    applications: actualApplications,
    deleteApplication,
    isDeletingApplication,
  } = useApplications();

  const { byApplicationId: enrollmentsByAppId } = useEnrollments();

  const [activeTab, setActiveTab] = useState("favorites");
  const [myDaycaresPage, setMyDaycaresPage] = useState(1);
  const [myDaycaresPageSize, setMyDaycaresPageSize] = useState(10);
  const [selectedContactLog, setSelectedContactLog] = useState<ContactLogResponse | null>(null);
  const [isContactLogModalOpen, setIsContactLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"contactLog" | "application" | null>(null);
  const [openFavoriteDropdownId, setOpenFavoriteDropdownId] = useState<string | null>(null);
  const [removeFavoriteId, setRemoveFavoriteId] = useState<string | null>(null);

  const allowedTabs = useMemo(
    () => new Set(["favorites", "applications", "my-daycares"]),
    []
  );

  const getTabFromLocation = () => {
    if (typeof window === "undefined") return "favorites";
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    return tabParam && allowedTabs.has(tabParam) ? tabParam : "favorites";
  };

  useEffect(() => {
    const nextTab = getTabFromLocation();
    if (nextTab !== activeTab) setActiveTab(nextTab);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (!params.get("tab")) {
        router.replace(`/parent/dashboard?tab=${nextTab}`, { scroll: false });
      }
    }

    const onPopState = () => {
      setActiveTab(getTabFromLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedTabs]);

  const setActiveTabAndUrl = (tabId: string) => {
    const nextTab = allowedTabs.has(tabId) ? tabId : "favorites";
    setActiveTab(nextTab);
    router.push(`/parent/dashboard?tab=${nextTab}`, { scroll: false });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdownId]);

  // Close favorites dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openFavoriteDropdownId) {
        setOpenFavoriteDropdownId(null);
      }
    };
    if (openFavoriteDropdownId) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openFavoriteDropdownId]);

  // Handle delete contact log
  const handleDeleteContactLog = (contactLogId: string) => {
    deleteContactLog(contactLogId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        setDeleteType(null);
        toast.success("Contact log deleted successfully");
      },
      onError: (error) => {
        console.error("Error deleting contact log:", error);
        toast.error("Failed to delete contact log. Please try again.");
      },
    });
  };

  // Handle delete application
  const handleDeleteApplication = (applicationId: string) => {
    deleteApplication(applicationId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        setDeleteType(null);
        toast.success("Application deleted successfully");
      },
      onError: (error) => {
        console.error("Error deleting application:", error);
        toast.error("Failed to delete application. Please try again.");
      },
    });
  };

  // Handle delete (works for both contact logs and applications)
  const handleDelete = () => {
    if (!deleteConfirmId) return;
    
    if (deleteType === "application") {
      handleDeleteApplication(deleteConfirmId);
    } else {
      handleDeleteContactLog(deleteConfirmId);
    }
  };

  // Handle remove favorite
  const handleRemoveFavorite = (daycareId: string) => {
    removeFavorite(daycareId, {
      onSuccess: () => {
        setRemoveFavoriteId(null);
        toast.success("Removed from favorites successfully");
      },
      onError: (error) => {
        console.error("Error removing favorite:", error);
        toast.error("Failed to remove favorite. Please try again.");
      },
    });
  };

  // Transform backend favorites to SavedSearch format
  const savedSearches = useMemo<SavedSearch[]>(() => {
    if (!favorites || favorites.length === 0) {
      return [];
    }

    return favorites
      .filter((favorite) => favorite.daycare) // Filter out favorites without daycare data
      .map((favorite) => {
        const daycare = favorite.daycare!; // Non-null assertion since we filtered above
        const daycareId = daycare._id || daycare.id || favorite.daycareId;

      // Format price
      const price = formatDaycarePrice(
        daycare.price || daycare.monthlyFee,
        daycare.priceString as string | null | undefined
      );

      // Format location
      const location = daycare.address
        ? `${daycare.address}${daycare.city ? `, ${daycare.city}, ON` : ", ON"}`
        : daycare.city
        ? `${daycare.city}, ON`
        : "Location not available";

      // Determine status from availability
      let status: "available" | "waitlist" | "full" = "available";
      if (daycare.availability) {
        const availability = daycare.availability.toLowerCase();
        if (
          availability.includes("waitlist") ||
          availability.includes("wait")
        ) {
          status = "waitlist";
        } else if (
          availability.includes("full") ||
          availability.includes("no space")
        ) {
          status = "full";
        }
      } else if (daycare.status) {
        const statusStr = daycare.status.toLowerCase();
        if (statusStr.includes("waitlist") || statusStr.includes("wait")) {
          status = "waitlist";
        } else if (
          statusStr.includes("full") ||
          statusStr.includes("no space")
        ) {
          status = "full";
        }
      }

      return {
        id: daycareId,
        name: daycare.name || "Unnamed KinderBridge",
        location,
        price,
        image: daycare.image || "/api/placeholder/400/300",
        status,
      };
    });
  }, [favorites]);

  // Transform contact logs to match Application card format
  const applications = useMemo<Application[]>(() => {
    if (!contactLogs || contactLogs.length === 0) {
      return [];
    }

    return contactLogs.map((log) => {
      const daycare = log.daycare;
      // Prioritize numeric id field for URL routing (e.g., /daycare/2)
      const daycareId = daycare?.id || log.daycareId || daycare?._id;

      // Format location
      const location = daycare?.address
        ? `${daycare.address}${daycare.city ? `, ${daycare.city}, ON` : ", ON"}`
        : daycare?.city
        ? `${daycare.city}, ON`
        : "Location not available";

      // Format price
      let price = "$0/month";
      const priceValue = (daycare?.price || daycare?.monthlyFee) as number | string | null | undefined;
      price = formatDaycarePrice(
        priceValue,
        daycare?.priceString as string | null | undefined
      );

      // Map contact log purpose/outcome to application status
      let status: "pending" | "accepted" | "rejected" = "pending";
      if (log.outcome) {
        const outcome = log.outcome.toLowerCase();
        if (outcome.includes("accepted") || outcome.includes("approved")) {
          status = "accepted";
        } else if (
          outcome.includes("rejected") ||
          outcome.includes("declined")
        ) {
          status = "rejected";
        }
      } else if (log.purpose === "Application Status") {
        status = "pending";
      }

      return {
        id: daycareId || log._id,
        contactLogId: log._id, // Store the contact log ID for easy lookup
        daycareName: daycare?.name || "KinderBridge",
        location,
        price,
        image: (daycare?.image as string | undefined) || "/api/placeholder/400/300",
        status,
        appliedDate: log.followUpDate || log.createdAt, // Use followUpDate if available, otherwise fallback to createdAt
        hasFollowUpDate: !!log.followUpDate, // Flag to indicate if we're showing followup date
      };
    });
  }, [contactLogs]);

  const autoApplyApplications = useMemo(() => {
    const apps = Array.isArray(actualApplications) ? actualApplications : [];
    return apps.filter((a) => (a as { source?: string })?.source === "auto_apply");
  }, [actualApplications]);

  useEffect(() => {
    setMyDaycaresPage(1);
  }, [autoApplyApplications.length, myDaycaresPageSize]);

  const myDaycaresTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(autoApplyApplications.length / myDaycaresPageSize));
  }, [autoApplyApplications.length, myDaycaresPageSize]);

  const myDaycaresPagedApps = useMemo(() => {
    const safePage = Math.min(Math.max(1, myDaycaresPage), myDaycaresTotalPages);
    const start = (safePage - 1) * myDaycaresPageSize;
    return autoApplyApplications.slice(start, start + myDaycaresPageSize);
  }, [autoApplyApplications, myDaycaresPage, myDaycaresPageSize, myDaycaresTotalPages]);

  // Note: Authentication and redirects are handled by middleware
  // This component trusts that middleware has validated access

  const tabs = [
    { id: "my-daycares", name: "My Daycares", icon: BuildingOffice2Icon },
    { id: "favorites", name: "Favorites", icon: MagnifyingGlassIcon },
    { id: "applications", name: "Applications", icon: DocumentTextIcon },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "full":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "waitlist":
        return "Waitlist";
      case "full":
        return "Full";
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is not a parent, middleware should have redirected
  // But if we somehow get here (e.g., during initial load), show loading
  // Middleware handles all redirects, so we just wait for user data
  if (!user || user.userType !== "parent") {
    // Still loading auth - show loading state
    if (authLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    // Auth loaded but no user or wrong type - middleware should redirect
    // Show loading while middleware redirects (shouldn't happen, but fallback)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Tabs - Horizontal */}
        <div className="lg:hidden mb-6">
          <nav className="flex space-x-2 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabAndUrl(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-t-lg transition-colors border-b-2 ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "text-gray-700 hover:bg-gray-100 border-transparent"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-white" : "text-blue-600"
                    }`}
                  />
                  <span className="font-medium text-sm sm:text-base">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabAndUrl(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? "text-white" : "text-blue-600"
                      }`}
                    />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            {/* Tab Content */}
            {activeTab === "my-daycares" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    My Daycares
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Tracking {autoApplyApplications.length}{" "}
                    {autoApplyApplications.length === 1
                      ? "auto-apply submission"
                      : "auto-apply submissions"}{" "}
                    for{" "}
                    <span className="font-semibold text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </p>
                </div>

                {/* KPI Cards (Auto-Apply) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  {(() => {
                    const total = autoApplyApplications.length;
                    const queueStatuses = autoApplyApplications.map((app) => {
                      const appId = String(
                        (app as { _id?: string; id?: string })._id ||
                          (app as { id?: string }).id ||
                          ""
                      );
                      const enrollment = enrollmentsByAppId.get(appId);
                      return enrollment
                        ? getEnrollmentQueueStatus(enrollment)
                        : "not_started";
                    });
                    const submitted = queueStatuses.filter((s) => s === "submitted").length;
                    const submitting = queueStatuses.filter(
                      (s) => s === "pending_automation" || s === "running"
                    ).length;
                    const failed = queueStatuses.filter((s) => s === "failed").length;
                    const draft = queueStatuses.filter(
                      (s) => s === "draft" || s === "not_started"
                    ).length;
                    const cards = [
                      {
                        label: "Total",
                        value: total,
                        bg: "bg-violet-50",
                        text: "text-violet-700",
                      },
                      {
                        label: "Submitted",
                        value: submitted,
                        bg: "bg-emerald-50",
                        text: "text-emerald-700",
                      },
                      {
                        label: "Submitting",
                        value: submitting,
                        bg: "bg-blue-50",
                        text: "text-blue-700",
                      },
                      {
                        label: "Failed",
                        value: failed,
                        bg: "bg-red-50",
                        text: "text-red-700",
                      },
                      {
                        label: "Draft",
                        value: draft,
                        bg: "bg-slate-50",
                        text: "text-slate-700",
                      },
                    ];
                    return cards.map((c) => (
                      <div
                        key={c.label}
                        className={`rounded-2xl border border-gray-200 ${c.bg} p-5 text-center`}
                      >
                        <div className={`text-3xl font-extrabold ${c.text}`}>{c.value}</div>
                        <div className="text-xs font-medium text-gray-500 mt-1">{c.label}</div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Auto-apply (credit) daycares */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Your submissions</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Auto-Apply daycares — 1 credit per submission
                      </p>
                    </div>
                    <Link
                      href="/search"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Find more daycares
                    </Link>
                  </div>

                  {autoApplyApplications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-10 text-center">
                      <BuildingOffice2Icon className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-3 text-gray-800 font-medium">No auto-apply submissions yet</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                        After you use Auto-Apply, your submitted daycares will appear here.
                      </p>
                      <Link
                        href="/search"
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Browse daycares
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                      {/* Mobile cards */}
                      <div className="md:hidden divide-y divide-gray-100">
                        {myDaycaresPagedApps.map((app, rowIdx) => {
                          const daycare = app.daycare || null;
                          const daycareId = (daycare?._id || daycare?.id || app.daycareId) as
                            | string
                            | undefined;
                          const name = (daycare?.name as string | undefined) || "KinderBridge";
                          const childName =
                            (app as unknown as { childName?: string }).childName || "";
                          const city = (daycare?.city as string | undefined) || "";
                          const responseMessage =
                            (app as unknown as { responseMessage?: string }).responseMessage || "";
                          const submitted = app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—";
                          const rowKey = String(
                            (app as { _id?: string; id?: string })._id ||
                              (app as { id?: string }).id ||
                              daycareId ||
                              `row-${rowIdx}`
                          );
                          const enrollment = enrollmentsByAppId.get(rowKey);
                          const displayName = enrollment
                            ? enrollmentDaycareDisplayName(enrollment, name)
                            : name;
                          const displayChildName = enrollmentChildDisplayName(
                            enrollment,
                            childName
                          );
                          const initial = displayName.charAt(0).toUpperCase();

                          return (
                            <div key={rowKey} className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                                  {initial}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 leading-snug">{displayName}</p>
                                  {city ? (
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                      <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                                      {city}
                                    </p>
                                  ) : null}
                                </div>
                                {enrollment ? (
                                  <EnrollmentStatusBadge record={enrollment} />
                                ) : (
                                  <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                    Not started
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Child</p>
                                  <p className="text-gray-800 font-medium truncate">{displayChildName || "—"}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Submitted</p>
                                  <p className="text-gray-800 font-medium">{submitted}</p>
                                </div>
                              </div>
                              {responseMessage ? (
                                <p className="text-sm text-gray-600 line-clamp-2">{responseMessage}</p>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Awaiting response</p>
                              )}
                              {daycareId ? (
                                <Link
                                  href={`/daycare/${String(daycareId)}`}
                                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  View daycare
                                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                </Link>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200 bg-slate-50/90">
                              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Daycare
                              </th>
                              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Child
                              </th>
                              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Status
                              </th>
                              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 min-w-[12rem]">
                                Response
                              </th>
                              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                Submitted
                              </th>
                              <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {myDaycaresPagedApps.map((app, rowIdx) => {
                              const daycare = app.daycare || null;
                              const daycareId = (daycare?._id || daycare?.id || app.daycareId) as
                                | string
                                | undefined;
                              const name = (daycare?.name as string | undefined) || "KinderBridge";
                              const childName =
                                (app as unknown as { childName?: string }).childName || "";
                              const city = (daycare?.city as string | undefined) || "";
                              const responseMessage =
                                (app as unknown as { responseMessage?: string }).responseMessage || "";
                              const submitted = app.createdAt
                                ? new Date(app.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—";
                              const rowKey = String(
                                (app as { _id?: string; id?: string })._id ||
                                  (app as { id?: string }).id ||
                                  daycareId ||
                                  `row-${rowIdx}`
                              );
                              const enrollment = enrollmentsByAppId.get(rowKey);
                              const displayName = enrollment
                                ? enrollmentDaycareDisplayName(enrollment, name)
                                : name;
                              const displayChildName = enrollmentChildDisplayName(
                                enrollment,
                                childName
                              );
                              const initial = displayName.charAt(0).toUpperCase();

                              return (
                                <tr
                                  key={rowKey}
                                  className="group transition-colors hover:bg-indigo-50/30"
                                >
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3 min-w-[14rem]">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-700 group-hover:bg-indigo-100">
                                        {initial}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                                          {displayName}
                                        </p>
                                        {city ? (
                                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                                            {city}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <UserIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                      <span className="font-medium">{displayChildName || "—"}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 whitespace-nowrap">
                                    {enrollment ? (
                                      <EnrollmentStatusBadge record={enrollment} />
                                    ) : (
                                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                        Not started
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 max-w-xs">
                                    {responseMessage ? (
                                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                        {responseMessage}
                                      </p>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">Awaiting response</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap tabular-nums">
                                    {submitted}
                                  </td>
                                  <td className="px-5 py-4 text-right whitespace-nowrap">
                                    {daycareId ? (
                                      <Link
                                        href={`/daycare/${String(daycareId)}`}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                      >
                                        View
                                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                      </Link>
                                    ) : (
                                      <span className="text-sm text-gray-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-gray-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm text-gray-600">
                            Page{" "}
                            <span className="font-semibold text-gray-900">{myDaycaresPage}</span>
                            {" "}of{" "}
                            <span className="font-semibold text-gray-900">{myDaycaresTotalPages}</span>
                          </p>
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            Rows
                            <select
                              value={myDaycaresPageSize}
                              onChange={(e) => setMyDaycaresPageSize(Number(e.target.value) || 10)}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                            </select>
                          </label>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setMyDaycaresPage((p) => Math.max(1, p - 1))}
                            disabled={myDaycaresPage <= 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMyDaycaresPage((p) => Math.min(myDaycaresTotalPages, p + 1))
                            }
                            disabled={myDaycaresPage >= myDaycaresTotalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                          >
                            Next
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "favorites" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Favorites
                </h1>

                {/* Loading State */}
                {favoritesLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading favorites...</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {favoritesError && !favoritesLoading && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-800">
                        Failed to load favorites. Please try again later.
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!favoritesLoading &&
                  !favoritesError &&
                  savedSearches.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No favorites yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start exploring daycares and save your favorites to see
                        them here.
                      </p>
                      <Link
                        href="/search"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                      >
                        Browse Daycares
                      </Link>
                    </div>
                  )}

                {/* Favorites Grid */}
                {!favoritesLoading &&
                  !favoritesError &&
                  savedSearches.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {savedSearches.map((search) => {
                        // Get the corresponding favorite object to access daycareId
                        const favorite = favorites.find(
                          (fav) =>
                            (fav.daycare?._id || fav.daycare?.id || fav.daycareId) === search.id
                        );
                        const daycareId = favorite?.daycareId || search.id;
                        return (
                        <div
                          key={search.id}
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="relative">
                            <div className="w-full h-40 sm:h-48 bg-gray-200 flex items-center justify-center">
                              {search.image &&
                              search.image !== "/api/placeholder/400/300" ? (
                                <img
                                  src={search.image}
                                  alt={search.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-500 text-center">
                                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                                  <p className="text-sm">Daycare Image</p>
                                </div>
                              )}
                            </div>
                            <div className="absolute top-2 right-2">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenFavoriteDropdownId(
                                      openFavoriteDropdownId === search.id
                                        ? null
                                        : search.id
                                    );
                                  }}
                                  className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                  <EllipsisVerticalIcon className="h-4 w-4 text-gray-600" />
                                </button>
                                {openFavoriteDropdownId === search.id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRemoveFavoriteId(daycareId);
                                        setOpenFavoriteDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      Remove from Favorites
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-2 left-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                  search.status
                                )}`}
                              >
                                {getStatusText(search.status)}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 sm:p-4">
                            <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">
                              {search.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                              {search.location}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                {search.price}
                              </span>
                            </div>
                            <Link
                              href={`/daycare/${search.id}`}
                              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-center text-sm sm:text-base"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
              </motion.div>
            )}

            {activeTab === "applications" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Contact Logs
                </h1>
                {contactLogsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">
                      Loading contact logs...
                    </p>
                  </div>
                ) : contactLogsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">
                      Error loading contact logs:{" "}
                      {contactLogsError.message || "Unknown error"}
                    </p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-2">No contact logs yet.</p>
                    <p className="text-sm text-gray-500">
                      Start logging your daycare communications from the search
                      page.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative">
                          <div className="w-full h-40 sm:h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                            {application.image &&
                            application.image !== "/api/placeholder/400/300" ? (
                              <img
                                src={application.image}
                                alt={application.daycareName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-500 text-center">
                                <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                                <p className="text-sm">Daycare Image</p>
                              </div>
                            )}
                          </div>
                          <div className="absolute top-2 right-2">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(
                                    openDropdownId === application.id
                                      ? null
                                      : String(application.id)
                                  );
                                }}
                                className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                              >
                                <EllipsisVerticalIcon className="h-4 w-4 text-gray-600" />
                              </button>
                              {openDropdownId === application.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Use contactLogId if available, otherwise find by matching
                                      const log = application.contactLogId
                                        ? contactLogs.find(
                                            (log) => log._id === application.contactLogId
                                          )
                                        : contactLogs.find(
                                            (log) =>
                                              (log.daycare?._id ||
                                                log.daycare?.id ||
                                                log.daycareId) === application.id ||
                                              log._id === application.id
                                          );
                                      if (log) {
                                        console.log("Opening edit modal for contact log:", log);
                                        setSelectedContactLog(log);
                                        setIsEditModalOpen(true);
                                        setOpenDropdownId(null);
                                      } else {
                                        console.error("Contact log not found for application:", application);
                                        console.log("Available contact logs:", contactLogs);
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Check if it's an actual application from Application model
                                      const actualApp = actualApplications?.find(
                                        (app) => app._id === application.id || app._id === application.contactLogId
                                      );
                                      
                                      if (actualApp) {
                                        // It's an actual application
                                        setDeleteConfirmId(actualApp._id);
                                        setDeleteType("application");
                                        setOpenDropdownId(null);
                                      } else {
                                        // It's a contact log
                                        const log = contactLogs.find(
                                          (log) =>
                                            (log.daycare?._id ||
                                              log.daycare?.id ||
                                              log.daycareId) === application.id ||
                                            log._id === application.id ||
                                            log._id === application.contactLogId
                                        );
                                        if (log) {
                                          setDeleteConfirmId(log._id);
                                          setDeleteType("contactLog");
                                          setOpenDropdownId(null);
                                        }
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {getStatusText(application.status)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 sm:p-4">
                          <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">
                            {application.daycareName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                            {application.location}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg font-semibold text-gray-900">
                              {application.price}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3">
                            <span>
                              {application.hasFollowUpDate ? "Follow up: " : "Contacted: "}
                              {new Date(
                                application.appliedDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              // Use contactLogId if available, otherwise find by matching
                              const log = application.contactLogId
                                ? contactLogs.find(
                                    (log) => log._id === application.contactLogId
                                  )
                                : contactLogs.find(
                                    (log) =>
                                      (log.daycare?._id ||
                                        log.daycare?.id ||
                                        log.daycareId) === application.id ||
                                      log._id === application.id
                                  );
                              if (log) {
                                console.log("Opening view modal for contact log:", log);
                                setSelectedContactLog(log);
                                setIsContactLogModalOpen(true);
                              } else {
                                console.error("Contact log not found for application:", application);
                                console.log("Available contact logs:", contactLogs);
                              }
                            }}
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-center text-sm sm:text-base"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Log Details Modal */}
      <ContactLogDetailsModal
        isOpen={isContactLogModalOpen}
        onClose={() => {
          setIsContactLogModalOpen(false);
          setSelectedContactLog(null);
        }}
        contactLog={selectedContactLog}
      />

      {/* Edit Contact Log Modal */}
      <EditContactLogModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedContactLog(null);
        }}
        contactLog={selectedContactLog}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete {deleteType === "application" ? "Application" : "Contact Log"}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {deleteType === "application" ? "application" : "contact log"}? This action
              cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteType(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isDeletingContactLog || isDeletingApplication}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeletingContactLog || isDeletingApplication}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isDeletingContactLog || isDeletingApplication) ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Favorite Confirmation Modal */}
      {removeFavoriteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove from Favorites
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this daycare from your favorites? You can add it back anytime.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setRemoveFavoriteId(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isRemovingFavorite}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveFavorite(removeFavoriteId)}
                disabled={isRemovingFavorite}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemovingFavorite ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
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
