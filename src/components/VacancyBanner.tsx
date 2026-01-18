"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Baby, Users, GraduationCap, School, ArrowRight } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../lib/api";

interface VacancyStats {
  region: string;
  infant: number;
  toddler: number;
  preschool: number;
  kindergarten: number;
  schoolAge: number;
}

const ageGroupConfig = [
  {
    key: "infant",
    label: "Infant",
    description: "0-18 months",
    icon: Baby,
    color: "from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
  },
  {
    key: "toddler",
    label: "Toddler",
    description: "18-30 months",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    hoverColor: "hover:from-purple-600 hover:to-purple-700",
  },
  {
    key: "preschool",
    label: "Preschool",
    description: "30 months-4/5 years",
    icon: GraduationCap,
    color: "from-green-500 to-green-600",
    hoverColor: "hover:from-green-600 hover:to-green-700",
  },
  {
    key: "schoolAge",
    label: "School-Age",
    description: "5-12 years",
    icon: School,
    color: "from-orange-500 to-orange-600",
    hoverColor: "hover:from-orange-600 hover:to-orange-700",
  },
];

export default function VacancyBanner() {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ["vacancy-stats", "Toronto"],
    queryFn: async () => {
      const response = await apiClient.get(
        "/api/daycares/vacancy-stats?region=Toronto"
      );
      return response.data as { data: VacancyStats };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const stats = statsResponse?.data;

  // Don't show banner if no stats or all counts are 0
  if (!stats || (!stats.infant && !stats.toddler && !stats.preschool && !stats.schoolAge)) {
    return null;
  }

  const handleAgeGroupClick = (ageGroupKey: string) => {
    // Map banner keys to FilterPanel values
    const ageRangeMap: Record<string, string> = {
      infant: "Infants",
      toddler: "Toddlers",
      preschool: "Preschool",
      schoolAge: "School Age",
    };
    
    // Navigate to search page with filters
    // Use region parameter - no city/ward filter
    const params = new URLSearchParams({
      region: "Toronto",
      ageRange: ageRangeMap[ageGroupKey] || ageGroupKey,
      vacancy: "yes",
    });
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <section className="py-6 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
                  Available Daycare Spots in Toronto Today
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                  Click any age group to see available daycares
                </p>
              </div>
            </div>
          </div>

          {/* Compact Age Group Cards - Horizontal Layout */}
          {isLoading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Loading availability...
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {ageGroupConfig.map((group) => {
                  const count = stats[group.key as keyof VacancyStats] as number;
                  const Icon = group.icon;

                  // Only show if count > 0
                  if (!count || count === 0) return null;

                  return (
                    <motion.button
                      key={group.key}
                      onClick={() => handleAgeGroupClick(group.key)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`bg-gradient-to-br ${group.color} ${group.hoverColor} rounded-lg p-4 sm:p-5 text-white shadow-md transition-all cursor-pointer border border-white/20 hover:border-white/40 hover:shadow-lg w-full flex items-center gap-3 sm:gap-4 group`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 bg-white/20 rounded-lg p-2.5 sm:p-3 group-hover:bg-white/30 transition-colors">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-bold truncate">{group.label}</h3>
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className="text-2xl sm:text-3xl font-extrabold leading-none whitespace-nowrap">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm font-medium opacity-95">spots</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/90 mb-2 leading-tight">
                          {group.description}
                        </p>
                        <div className="flex items-center text-xs font-medium opacity-90 group-hover:opacity-100">
                          <span className="mr-1">View</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Compact Footer Note */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-[10px] sm:text-xs text-gray-500 text-center leading-relaxed">
                  Availability data is sourced from the Municipality website. Actual spots may vary. Please contact daycares directly to confirm.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
