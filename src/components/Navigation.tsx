"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { getAutoApplyCredits } from "../lib/applicationsService";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UserIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);
  const [creditsTotal, setCreditsTotal] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDashboardUrl = () => {
    if (!user) return "/dashboard";
    switch (user.userType) {
      case "provider":
        return "/provider/dashboard";
      case "parent":
        return "/parent/dashboard";
      default:
        return "/dashboard";
    }
  };

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Find Daycares", href: "/search", icon: MagnifyingGlassIcon },
    { name: "About", href: "/about", icon: InformationCircleIcon },
    { name: "Contact", href: "/contact", icon: EnvelopeIcon },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isUserDropdownOpen]);

  useEffect(() => {
    let mounted = true;

    const loadCredits = async () => {
      if (!user || user.userType !== "parent") {
        setCreditsUsed(null);
        setCreditsTotal(null);
        return;
      }
      try {
        const response = await getAutoApplyCredits();
        if (!mounted) return;
        const total = Number(response.data.totalCredits);
        const used = Number(response.data.usedCredits);
        const remaining = Number(response.data.remainingCredits);

        // Hide badge when user has not purchased any credits yet.
        if (!Number.isFinite(total) || total <= 0) {
          setCreditsTotal(null);
          setCreditsUsed(null);
          return;
        }

        // Display as x/30 (pack size), even if backend returns unexpected totals.
        const PACK = 30;
        const normalizedUsed = Number.isFinite(used)
          ? Math.min(PACK, Math.max(0, used))
          : null;
        const normalizedRemaining = Number.isFinite(remaining)
          ? Math.min(PACK, Math.max(0, remaining))
          : null;

        setCreditsTotal(PACK);
        if (normalizedUsed !== null) {
          setCreditsUsed(normalizedUsed);
        } else if (normalizedRemaining !== null) {
          setCreditsUsed(PACK - normalizedRemaining);
        } else {
          setCreditsUsed(0);
        }
      } catch {
        if (!mounted) return;
        setCreditsUsed(null);
        setCreditsTotal(null);
      }
    };

    loadCredits();

    return () => {
      mounted = false;
    };
  }, [user?._id, user?.userType]);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsUserDropdownOpen(false);
    const dashboardUrl = getDashboardUrl();
    router.push(dashboardUrl);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
            >
              KinderBridge
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.userType === "parent" && creditsTotal !== null && (
                  <div className="rounded-full bg-[#F3E7E1] px-3 py-1 text-xs font-semibold text-[#F26A3D]">
                    {creditsUsed ?? 0}/{creditsTotal}
                  </div>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors max-w-48"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="truncate">
                      {user.firstName || user.email}
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform flex-shrink-0 ${
                        isUserDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={handleDashboardClick}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-200 absolute top-16 left-0 right-0 z-50 shadow-lg"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile Auth Buttons */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {user ? (
                <>
                  <div className="px-3 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                    {user.userType === "parent" && creditsTotal !== null && (
                      <p className="mt-2 inline-block rounded-full bg-[#F3E7E1] px-2 py-0.5 text-[11px] font-semibold text-[#F26A3D]">
                        Credits used: {creditsUsed ?? 0}/{creditsTotal}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      const dashboardUrl = getDashboardUrl();
                      router.push(dashboardUrl);
                    }}
                    className="flex items-center space-x-2 px-3 py-3 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-3 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-3 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-3 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
