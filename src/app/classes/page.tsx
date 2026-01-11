"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  Star,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPinIcon,
  Lock,
  UserPlus,
  LogIn,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ClassItem {
  id: number;
  name: string;
  age: string;
  duration: string;
  schedule: string;
  location: string;
  rating: number;
  price: string;
  description: string;
  instructor: string;
  maxStudents: number;
  category: string;
  difficulty: string;
  materials: string[];
  learningObjectives: string[];
  image: string;
  availableSpots: number;
  startDate: string;
  endDate: string;
  reviews: number;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);

  const classes = useMemo(
    () => [
      {
        id: 1,
        name: "Early Learning Program",
        age: "2-4 years",
        duration: "2 hours",
        schedule: "Mon, Wed, Fri",
        location: "Downtown Toronto",
        rating: 4.8,
        price: "$45/session",
        description:
          "Comprehensive early learning program focusing on cognitive development, social skills, and creativity.",
        instructor: "Sarah Johnson",
        maxStudents: 12,
        category: "Academic",
        difficulty: "Beginner",
        materials: ["Workbooks", "Art supplies", "Educational toys"],
        learningObjectives: [
          "Letter recognition",
          "Number skills",
          "Social interaction",
        ],
        image: "🎓",
        availableSpots: 3,
        startDate: "2024-09-01",
        endDate: "2024-12-15",
        reviews: 24,
      },
      {
        id: 2,
        name: "Music & Movement",
        age: "1-3 years",
        duration: "1 hour",
        schedule: "Tue, Thu",
        location: "North York",
        rating: 4.9,
        price: "$35/session",
        description:
          "Interactive music and movement class to develop rhythm, coordination, and musical appreciation.",
        instructor: "Michael Chen",
        maxStudents: 15,
        category: "Creative",
        difficulty: "Beginner",
        materials: ["Instruments", "Props", "Audio equipment"],
        learningObjectives: [
          "Rhythm development",
          "Motor coordination",
          "Musical appreciation",
        ],
        image: "🎵",
        availableSpots: 8,
        startDate: "2024-09-03",
        endDate: "2024-12-19",
        reviews: 31,
      },
      {
        id: 3,
        name: "Art & Creativity",
        age: "3-5 years",
        duration: "1.5 hours",
        schedule: "Sat",
        location: "Scarborough",
        rating: 4.7,
        price: "$40/session",
        description:
          "Creative arts and crafts class to develop fine motor skills and artistic expression.",
        instructor: "Emily Rodriguez",
        maxStudents: 10,
        category: "Creative",
        difficulty: "Beginner",
        materials: ["Paints", "Brushes", "Canvas", "Craft supplies"],
        learningObjectives: [
          "Fine motor skills",
          "Creative expression",
          "Color theory",
        ],
        image: "🎨",
        availableSpots: 2,
        startDate: "2024-09-07",
        endDate: "2024-12-21",
        reviews: 18,
      },
      {
        id: 4,
        name: "Language Development",
        age: "2-4 years",
        duration: "1 hour",
        schedule: "Mon, Wed",
        location: "Mississauga",
        rating: 4.6,
        price: "$50/session",
        description:
          "Bilingual language development program in English and French.",
        instructor: "Marie Dubois",
        maxStudents: 8,
        category: "Language",
        difficulty: "Beginner",
        materials: ["Flashcards", "Books", "Audio materials"],
        learningObjectives: [
          "Vocabulary building",
          "Pronunciation",
          "Cultural awareness",
        ],
        image: "📚",
        availableSpots: 5,
        startDate: "2024-09-02",
        endDate: "2024-12-16",
        reviews: 15,
      },
      {
        id: 5,
        name: "Science Explorer",
        age: "5-8 years",
        duration: "2 hours",
        schedule: "Fri",
        location: "Brampton",
        rating: 4.9,
        price: "$55/session",
        description:
          "Hands-on science experiments to spark curiosity and develop critical thinking skills.",
        instructor: "Dr. Alex Thompson",
        maxStudents: 12,
        category: "Science",
        difficulty: "Intermediate",
        materials: ["Lab equipment", "Safety gear", "Experiment kits"],
        learningObjectives: [
          "Scientific method",
          "Critical thinking",
          "Problem solving",
        ],
        image: "🔬",
        availableSpots: 6,
        startDate: "2024-09-06",
        endDate: "2024-12-20",
        reviews: 42,
      },
      {
        id: 6,
        name: "Sports & Fitness",
        age: "4-7 years",
        duration: "1.5 hours",
        schedule: "Tue, Thu, Sat",
        location: "Oakville",
        rating: 4.5,
        price: "$38/session",
        description:
          "Active sports and fitness program to develop physical coordination and healthy habits.",
        instructor: "Coach David Wilson",
        maxStudents: 20,
        category: "Physical",
        difficulty: "Beginner",
        materials: ["Sports equipment", "Safety gear", "Water bottles"],
        learningObjectives: [
          "Physical coordination",
          "Teamwork",
          "Healthy habits",
        ],
        image: "⚽",
        availableSpots: 12,
        startDate: "2024-09-03",
        endDate: "2024-12-19",
        reviews: 28,
      },
    ],
    []
  );

  const categories = [
    "All",
    "Academic",
    "Creative",
    "Language",
    "Science",
    "Physical",
    "Social",
  ];
  const ageRanges = [
    "All",
    "1-2 years",
    "2-4 years",
    "3-5 years",
    "4-7 years",
    "5-8 years",
  ];
  const locations = [
    "All",
    "Downtown Toronto",
    "North York",
    "Scarborough",
    "Mississauga",
    "Brampton",
    "Oakville",
  ];
  const priceRanges = ["All", "Under $30", "$30-$40", "$40-$50", "Over $50"];
  const schedules = ["All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Filter and sort classes
  const filteredClasses = useMemo(() => {
    const filtered = classes.filter((cls) => {
      const matchesSearch =
        (cls.name &&
          typeof cls.name === "string" &&
          cls.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cls.description &&
          typeof cls.description === "string" &&
          cls.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cls.instructor &&
          typeof cls.instructor === "string" &&
          cls.instructor.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "" ||
        selectedCategory === "All" ||
        cls.category === selectedCategory;
      const matchesAge =
        selectedAge === "" || selectedAge === "All" || cls.age === selectedAge;
      const matchesLocation =
        selectedLocation === "" ||
        selectedLocation === "All" ||
        cls.location === selectedLocation;
      const matchesSchedule =
        selectedSchedule === "" ||
        selectedSchedule === "All" ||
        cls.schedule.includes(selectedSchedule);

      let matchesPrice = true;
      if (selectedPrice === "Under $30")
        matchesPrice =
          cls.price && typeof cls.price === "string"
            ? parseInt(cls.price.replace(/[^0-9]/g, "")) < 30
            : false;
      else if (selectedPrice === "$30-$40")
        matchesPrice =
          cls.price && typeof cls.price === "string"
            ? parseInt(cls.price.replace(/[^0-9]/g, "")) >= 30 &&
              parseInt(cls.price.replace(/[^0-9]/g, "")) <= 40
            : false;
      else if (selectedPrice === "$40-$50")
        matchesPrice =
          cls.price && typeof cls.price === "string"
            ? parseInt(cls.price.replace(/[^0-9]/g, "")) >= 40 &&
              parseInt(cls.price.replace(/[^0-9]/g, "")) <= 50
            : false;
      else if (selectedPrice === "Over $50")
        matchesPrice =
          cls.price && typeof cls.price === "string"
            ? parseInt(cls.price.replace(/[^0-9]/g, "")) > 50
            : false;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAge &&
        matchesLocation &&
        matchesPrice &&
        matchesSchedule
      );
    });

    // Sort classes
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "rating":
          aValue = a.rating;
          bValue = b.rating;
          break;
        case "price":
          aValue =
            a.price && typeof a.price === "string"
              ? parseInt(a.price.replace(/[^0-9]/g, ""))
              : 0;
          bValue =
            b.price && typeof b.price === "string"
              ? parseInt(b.price.replace(/[^0-9]/g, ""))
              : 0;
          break;
        case "startDate":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    searchQuery,
    selectedCategory,
    selectedAge,
    selectedLocation,
    selectedPrice,
    selectedSchedule,
    sortBy,
    sortOrder,
    classes,
  ]);

  // Guest users see only 2 results, authenticated users see paginated results
  const isGuest = !user;
  const guestLimit = 2;
  const maxResults = isGuest ? guestLimit : resultsPerPage;

  // Calculate pagination
  const totalPages = Math.ceil(filteredClasses.length / maxResults);
  const startIndex = (currentPage - 1) * maxResults;
  const endIndex = startIndex + maxResults;
  const displayedClasses = filteredClasses.slice(startIndex, endIndex);
  const hasMoreResults = filteredClasses.length > maxResults;

  // Pagination functions
  const goToPage = (page: number) => {
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedAge,
    selectedLocation,
    selectedPrice,
    selectedSchedule,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedAge("");
    setSelectedLocation("");
    setSelectedPrice("");
    setSelectedSchedule("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Navigation Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Classes</span>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-blue-700 mb-4">
                Find Classes
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Discover enriching classes and programs designed to support your
              child&apos;s development and learning journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for classes, instructors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {showFilters ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="price">Sort by Price</option>
                <option value="startDate">Sort by Start Date</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Range
                  </label>
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ageRanges.map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priceRanges.map((price) => (
                      <option key={price} value={price}>
                        {price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Schedule Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <select
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {schedules.map((schedule) => (
                      <option key={schedule} value={schedule}>
                        {schedule}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results Summary */}
      <section className="py-4 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {isGuest ? (
                <>
                  Showing{" "}
                  <span className="font-semibold">
                    {displayedClasses.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredClasses.length}
                  </span>{" "}
                  classes
                  <span className="text-orange-600 font-medium">
                    {" "}
                    (Sign in to see all {filteredClasses.length} results)
                  </span>
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold">
                    {displayedClasses.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredClasses.length}
                  </span>{" "}
                  classes
                  {totalPages > 1 && (
                    <span className="text-blue-600 font-medium">
                      {" "}
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </>
              )}
            </p>
            {Object.values({
              selectedCategory,
              selectedAge,
              selectedLocation,
              selectedPrice,
              selectedSchedule,
            }).some((val) => val !== "" && val !== "All") && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Classes Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {displayedClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No classes found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {displayedClasses.map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{classItem.image}</span>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {classItem.name}
                            </h3>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {classItem.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {classItem.rating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({classItem.reviews})
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">
                      {classItem.description}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{classItem.age}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{classItem.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{classItem.schedule}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{classItem.location}</span>
                      </div>
                    </div>

                    {/* Learning Objectives */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Learning Objectives:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {classItem.learningObjectives.map((objective, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {objective}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Materials Included:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {classItem.materials.map((material, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Instructor:</span>{" "}
                            {classItem.instructor}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Available spots:
                            </span>{" "}
                            {classItem.availableSpots} of{" "}
                            {classItem.maxStudents}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            {classItem.price}
                          </span>
                          <p className="text-sm text-gray-500">per session</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                          Enroll Now
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Want to Teach a Class?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Are you an educator or specialist? Join our platform and start
              offering classes to families in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/provider/register"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Become an Instructor
              </Link>
              <Link
                href="/search"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Daycares
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guest Limitation Banner */}
      {isGuest && hasMoreResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-lg mx-4 sm:mx-6 lg:mx-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Unlock All {filteredClasses.length} Classes
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              You&apos;re seeing only 2 of {filteredClasses.length} classes.
              Sign up for free to access all results, save favorites, and get
              personalized recommendations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>Sign Up for Free</span>
              </Link>
              <Link
                href="/login"
                className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Already have an account? Sign In</span>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {!isGuest && totalPages > 1 && (
        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

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
                  <span>Info@kinderbridge.ca</span>
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
