"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  Users,
  Shield,
  Clock,
  Mail,
  ArrowRight,
  CheckCircle,
  User,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { apiClient } from "../lib/api";

export default function HomePage() {
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [errors, setErrors] = useState<{
    location?: string;
  }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch regions from database
  const { data: regionsResponse, isLoading: regionsLoading } = useQuery({
    queryKey: ["daycares", "regions"],
    queryFn: async () => {
      const response = await apiClient.get("/api/daycares/regions/all");
      console.log("🏠 [HOME PAGE] API Response:", response);
      console.log("🏠 [HOME PAGE] response.data:", response.data);
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - regions rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached longer
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false,
  });

  console.log("🏠 [HOME PAGE] regionsResponse:", regionsResponse);
  console.log("🏠 [HOME PAGE] regionsResponse?.data:", regionsResponse?.data);

  const regions: string[] = Array.isArray(regionsResponse?.data)
    ? regionsResponse.data
    : Array.isArray(regionsResponse)
    ? regionsResponse
    : [];

  console.log("🏠 [HOME PAGE] Final regions array:", regions);
  console.log("🏠 [HOME PAGE] Regions count:", regions.length);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Reset errors
      const newErrors: { location?: string } = {};

      // Validate: location must be filled
      const hasLocation = location.trim().length > 0;

      if (!hasLocation) {
        newErrors.location = "Please select a location";
        setErrors(newErrors);
        return;
      }

      // Validate location: must be from the dropdown (valid region)
      if (hasLocation && !regions.includes(location.trim())) {
        newErrors.location = "Please select a valid location from the dropdown";
        setErrors(newErrors);
        return;
      }

      // Clear errors if validation passes
      setErrors({});

      // Navigate to search page with query parameters
      const params = new URLSearchParams();
      if (hasLocation) params.append("location", location.trim());

      window.location.href = `/search?${params.toString()}`;
    },
    [location, regions]
  );

  const selectRegion = useCallback(
    (region: string) => {
      setLocation(region);
      setShowLocationDropdown(false);
      // Clear location error when region is selected from dropdown
      if (errors.location) {
        setErrors((prev) => ({ ...prev, location: undefined }));
      }
    },
    [errors.location]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };

    if (showLocationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLocationDropdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Find the Perfect Daycare
              <br />
              for Your Child
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Browse daycares, read authentic reviews, and make informed
              decisions for your child&apos;s early education journey.
            </motion.p>

            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto mb-16"
            >
              <form
                onSubmit={handleSearch}
                className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div
                    ref={dropdownRef}
                    className="relative flex-1 w-full sm:w-auto"
                  >
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                      <input
                        type="text"
                        placeholder="Select a region"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setShowLocationDropdown(true);
                          // Clear error when user starts typing
                          if (errors.location) {
                            setErrors((prev) => ({
                              ...prev,
                              location: undefined,
                            }));
                          }
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                          errors.location ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.location}
                      </p>
                    )}
                    {/* Region Dropdown */}
                    {showLocationDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        {regionsLoading ? (
                          <div className="px-4 py-2 text-gray-500 text-center">
                            Loading regions...
                          </div>
                        ) : regions.length > 0 ? (
                          <div className="max-h-[320px] overflow-y-auto rounded-lg">
                            {regions.map((region, index) => {
                              console.log(
                                `🏠 [HOME PAGE] Rendering region ${index + 1}:`,
                                region
                              );
                              return (
                                <button
                                  key={region}
                                  type="button"
                                  onClick={() => selectRegion(region)}
                                  className="w-full px-4 py-3 text-left text-gray-800 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  {region}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-center">
                            No regions available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start w-full sm:w-auto">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center h-[48px]"
                    >
                      Search daycare
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Updated by Abhishek */}
      {/* 1. CLOSED THE GAP: Added pb-0 and negative margin fix */}
      <section className="relative overflow-hidden pb-0 mb-[-70px]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10"></div>
      </section>

      {/* 2. HOOKY HEADER: Added FOMO and 100 users badge */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold mb-6 backdrop-blur-sm border border-white/30 animate-pulse">
              🔥 EXCLUSIVE: FREE FOR FIRST 100 PARENTS
            </div>
            <h2 className="text-3xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Stop Stressing Over Waitlists
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed font-medium">
              Don&apos;t miss your spot. We automate the entire application
              process so you can secure your child&apos;s future while other
              parents are still filling out forms.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* 3. BLACK BLOCKS: Left Side Features - High Visibility Black Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bulk App Submission */}
              <div className="flex gap-6 p-8 bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-800 items-start hover:bg-black transition-all shadow-2xl group">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">
                    Bulk Application Submission
                  </h3>
                  <p className="text-gray-400 mt-2 leading-relaxed">
                    Why apply one by one? Submit waitlist inquiries to up to 30
                    top-rated daycares in a single click. We handle the grind.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-orange-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    Beat the rush on repetitive forms
                  </div>
                </div>
              </div>

              {/* Follow-Up Reminders */}
              <div className="flex gap-6 p-8 bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-800 items-start hover:bg-black transition-all shadow-2xl group">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">
                    Automatic Follow-Up Reminders
                  </h3>
                  <p className="text-gray-400 mt-2 leading-relaxed">
                    Stay at the top of the pile. Our system sends polite
                    follow-ups to daycare directors so your name is never
                    forgotten.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    100% Automated persistence
                  </div>
                </div>
              </div>

              {/* Compare Daycares */}
              <div className="flex gap-6 p-8 bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-800 items-start hover:bg-black transition-all shadow-2xl group">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">
                    Smart Side-by-Side Comparison
                  </h3>
                  <p className="text-gray-400 mt-2 leading-relaxed">
                    Don&apos;t settle. Compare costs, safety ratings, and
                    availability instantly. Make the right choice for your child
                    with zero guesswork.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-yellow-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    Data-driven decisions only
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Auto Apply Feature (The "Beta" Card) */}
            <div className="p-8 bg-white rounded-3xl border-4 border-yellow-400 shadow-2xl relative">
              {/* Only 100 Spots Badge */}
              <div className="absolute -top-5 -right-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black shadow-lg uppercase tracking-tighter">
                ONLY 100 SPOTS
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  Auto Apply Feature
                </h3>
                <p className="text-green-600 font-bold flex items-center justify-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  Claim Your Free Access after our Beta Launch!
                </p>
                <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                  Limited time • Full access
                </p>
              </div>

              {/* Feature List */}
              <ul className="space-y-4 mb-10">
                {[
                  "Submit applications to 30 daycares at once",
                  "Automated follow-up reminders",
                  "Compare daycares side-by-side",
                  "Smart follow-up scheduling",
                  "Application tracking dashboard",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-gray-700 font-semibold text-sm"
                  >
                    <div className="mt-1 bg-green-100 rounded-full p-0.5">
                      <svg
                        className="w-3.5 h-3.5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Register Button */}
              <Link href="/register" className="block">
                <button className="w-full py-5 px-6 rounded-2xl text-white font-black bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.03] transition-all shadow-xl shadow-blue-100 active:scale-95">
                  CLAIM MY FREE SPOT
                </button>
              </Link>

              <p className="text-center text-[11px] text-gray-400 mt-6 font-bold uppercase tracking-wide">
                🚀 No payment required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">KinderBridge</h3>
              <p className="text-gray-400">
                Connecting parents with trusted Daycares for a brighter future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Parents</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/search"
                    className="hover:text-white transition-colors"
                  >
                    Find Daycare
                  </Link>
                </li>
                <li>
                  <Link
                    href="/parent/dashboard?tab=favorites"
                    className="hover:text-white transition-colors"
                  >
                    My Favorites
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>
              <div className="space-y-2 text-gray-400">
                <p className="font-medium text-gray-300 mb-2">Email Us</p>
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>Info@kinderbridge.com</span>
                </div>
                <p className="text-sm text-gray-500">
                  We typically respond within 24 hours
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} KinderBridge. All rights
              reserved.
            </p>
            <div className="mt-2 flex justify-center items-center space-x-2">
              <span className="text-xs text-gray-500">
                Developed by ASH Web Solutions
              </span>
              <a
                href="https://ashwebsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-800"
                title="Visit ASH WEB Solutions"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
        {/* Updated KinderBridge Disclaimer - Added by Abhishek */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-800/40">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 mt-1">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm text-gray-400 leading-relaxed space-y-4">
                <p>
                  <span className="font-bold text-gray-300">Disclaimer:</span>{" "}
                  Every effort is made to ensure that the information on{" "}
                  <span className="text-blue-400 font-medium">
                    KinderBridge
                  </span>{" "}
                  is accurate, up-to-date, and comprehensive. However,{" "}
                  <span className="font-bold text-gray-300">
                    KinderBridge cannot assume liability resulting from errors
                    or omissions.
                  </span>{" "}
                  Inclusion or omission of a program or service is not a comment
                  on its quality.
                </p>
                <p>
                  Records in this database are compiled from publicly available
                  sources including government open data portals, Google Maps,
                  and individual daycare websites. KinderBridge cannot be held
                  responsible for the accuracy of information provided by these
                  external sources.{" "}
                  <span className="font-bold text-gray-300">
                    Users are urged to confirm all information independently
                  </span>{" "}
                  with daycare providers.
                </p>
                <p>
                  KinderBridge is{" "}
                  <span className="font-bold text-gray-300">
                    not affiliated with, endorsed by, or partnered with
                  </span>{" "}
                  any daycare centers, childcare providers, or government
                  agencies. Waitlist positions and availability estimates may
                  not reflect real-time status. If you have questions, please
                  see our{" "}
                  <Link href="/terms" className="text-blue-400 hover:underline">
                    Terms of Use
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/contact"
                    className="text-blue-400 hover:underline"
                  >
                    contact us
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
