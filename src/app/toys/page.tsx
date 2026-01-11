"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Heart,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Shield,
  Award,
  Truck,
  Lock,
  UserPlus,
  LogIn,
  User,
  LogOut,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ToyItem {
  id: number;
  name: string;
  age: string;
  price: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  image: string;
  category: string;
  brand: string;
  educationalValue: number;
  safetyRating: string;
  material: string;
  dimensions: string;
  weight: string;
  inStock: boolean;
  shipping: string;
  warranty: string;
  learningObjectives: string[];
  certifications: string[];
}

export default function ToysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedEducationalValue, setSelectedEducationalValue] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);

  const toys = useMemo(
    () => [
      {
        id: 1,
        name: "Building Blocks Set",
        age: "2-6 years",
        price: "$29.99",
        rating: 4.8,
        reviews: 124,
        description:
          "Colorful building blocks to develop spatial awareness, creativity, and fine motor skills.",
        features: [
          "100 pieces",
          "Educational",
          "Safe materials",
          "Storage bag included",
        ],
        image: "🧱",
        category: "Construction",
        brand: "EduBlocks",
        educationalValue: 5,
        safetyRating: "A+",
        material: "Non-toxic plastic",
        dimensions: '2.5" x 2.5" x 2.5"',
        weight: "2.5 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "1 year",
        learningObjectives: [
          "Spatial awareness",
          "Problem solving",
          "Creativity",
          "Fine motor skills",
        ],
        certifications: ["ASTM F963", "CE Certified", "CPSC Compliant"],
      },
      {
        id: 2,
        name: "Puzzle Collection",
        age: "3-8 years",
        price: "$24.99",
        rating: 4.9,
        reviews: 89,
        description:
          "Assorted puzzles ranging from simple shapes to complex scenes for cognitive development.",
        features: [
          "5 puzzles",
          "Progressive difficulty",
          "Durable pieces",
          "Travel case",
        ],
        image: "🧩",
        category: "Cognitive",
        brand: "BrainBuilders",
        educationalValue: 5,
        safetyRating: "A+",
        material: "Wood and cardboard",
        dimensions: '12" x 9" x 2"',
        weight: "1.8 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "6 months",
        learningObjectives: [
          "Pattern recognition",
          "Memory",
          "Hand-eye coordination",
          "Logic",
        ],
        certifications: ["ASTM F963", "FSC Certified"],
      },
      {
        id: 3,
        name: "Art & Craft Kit",
        age: "4-10 years",
        price: "$34.99",
        rating: 4.7,
        reviews: 156,
        description:
          "Complete art kit with paints, brushes, paper, and craft supplies for creative expression.",
        features: ["50+ pieces", "Non-toxic", "Washable", "Instruction guide"],
        image: "🎨",
        category: "Creative",
        brand: "CreativeKids",
        educationalValue: 4,
        safetyRating: "A",
        material: "Non-toxic materials",
        dimensions: '15" x 10" x 3"',
        weight: "3.2 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "1 year",
        learningObjectives: [
          "Creative expression",
          "Color theory",
          "Fine motor skills",
          "Imagination",
        ],
        certifications: ["AP Certified", "Non-toxic certified"],
      },
      {
        id: 4,
        name: "Musical Instruments",
        age: "1-5 years",
        price: "$39.99",
        rating: 4.6,
        reviews: 67,
        description:
          "Set of child-friendly musical instruments to develop rhythm and auditory skills.",
        features: [
          "8 instruments",
          "Safe materials",
          "Carrying case",
          "Learning guide",
        ],
        image: "🎵",
        category: "Musical",
        brand: "MusicMakers",
        educationalValue: 4,
        safetyRating: "A",
        material: "Wood and metal",
        dimensions: '18" x 12" x 4"',
        weight: "4.1 lbs",
        inStock: false,
        shipping: "$5.99 shipping",
        warranty: "1 year",
        learningObjectives: [
          "Rhythm development",
          "Auditory skills",
          "Coordination",
          "Musical appreciation",
        ],
        certifications: ["ASTM F963", "Lead-free certified"],
      },
      {
        id: 5,
        name: "Science Explorer Kit",
        age: "5-12 years",
        price: "$44.99",
        rating: 4.9,
        reviews: 203,
        description:
          "Hands-on science experiments to spark curiosity and develop critical thinking skills.",
        features: [
          "20 experiments",
          "Safety goggles",
          "Materials included",
          "Step-by-step guide",
        ],
        image: "🔬",
        category: "Science",
        brand: "ScienceWiz",
        educationalValue: 5,
        safetyRating: "A+",
        material: "Lab-grade materials",
        dimensions: '14" x 11" x 5"',
        weight: "5.5 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "2 years",
        learningObjectives: [
          "Scientific method",
          "Critical thinking",
          "Problem solving",
          "Curiosity",
        ],
        certifications: [
          "ASTM F963",
          "Lab safety certified",
          "Educational approved",
        ],
      },
      {
        id: 6,
        name: "Language Learning Cards",
        age: "2-8 years",
        price: "$19.99",
        rating: 4.5,
        reviews: 78,
        description:
          "Bilingual flash cards for vocabulary building and language development.",
        features: [
          "100 cards",
          "English/Spanish",
          "Colorful images",
          "Audio guide",
        ],
        image: "📚",
        category: "Language",
        brand: "LinguaLearn",
        educationalValue: 5,
        safetyRating: "A+",
        material: "Heavy-duty cardstock",
        dimensions: '4" x 6" x 2"',
        weight: "1.2 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "1 year",
        learningObjectives: [
          "Vocabulary building",
          "Language skills",
          "Memory",
          "Cultural awareness",
        ],
        certifications: ["Educational approved", "Bilingual certified"],
      },
      {
        id: 7,
        name: "Math Manipulatives",
        age: "3-7 years",
        price: "$32.99",
        rating: 4.8,
        reviews: 95,
        description:
          "Hands-on math tools to develop number sense and mathematical thinking.",
        features: [
          "Counting blocks",
          "Number cards",
          "Activity guide",
          "Storage box",
        ],
        image: "🔢",
        category: "Academic",
        brand: "MathMasters",
        educationalValue: 5,
        safetyRating: "A+",
        material: "Non-toxic plastic",
        dimensions: '10" x 8" x 3"',
        weight: "2.8 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "1 year",
        learningObjectives: [
          "Number recognition",
          "Counting skills",
          "Basic operations",
          "Patterns",
        ],
        certifications: ["ASTM F963", "Educational approved"],
      },
      {
        id: 8,
        name: "Social Skills Game",
        age: "4-9 years",
        price: "$27.99",
        rating: 4.4,
        reviews: 62,
        description:
          "Interactive board game to develop social skills, empathy, and emotional intelligence.",
        features: ["Board game", "Cards", "Dice", "Instructions"],
        image: "🎲",
        category: "Social",
        brand: "SocialSkills",
        educationalValue: 4,
        safetyRating: "A",
        material: "Cardboard and plastic",
        dimensions: '12" x 12" x 2"',
        weight: "1.5 lbs",
        inStock: true,
        shipping: "Free shipping",
        warranty: "6 months",
        learningObjectives: [
          "Social skills",
          "Emotional intelligence",
          "Empathy",
          "Communication",
        ],
        certifications: ["ASTM F963", "Child psychologist approved"],
      },
    ],
    []
  );

  const categories = [
    "All",
    "Construction",
    "Cognitive",
    "Creative",
    "Musical",
    "Science",
    "Language",
    "Academic",
    "Social",
  ];
  const ageRanges = [
    "All",
    "1-2 years",
    "2-4 years",
    "3-5 years",
    "4-7 years",
    "5-8 years",
    "6-10 years",
  ];
  const priceRanges = [
    "All",
    "Under $20",
    "$20-$30",
    "$30-$40",
    "$40-$50",
    "Over $50",
  ];
  const brands = [
    "All",
    "EduBlocks",
    "BrainBuilders",
    "CreativeKids",
    "MusicMakers",
    "ScienceWiz",
    "LinguaLearn",
    "MathMasters",
    "SocialSkills",
  ];
  const educationalValues = ["All", "High (5)", "Medium (4)", "Low (3)"];

  // Filter and sort toys
  const filteredToys = useMemo(() => {
    const filtered = toys.filter((toy) => {
      const matchesSearch =
        (toy.name &&
          typeof toy.name === "string" &&
          toy.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (toy.description &&
          typeof toy.description === "string" &&
          toy.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (toy.brand &&
          typeof toy.brand === "string" &&
          toy.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "" ||
        selectedCategory === "All" ||
        toy.category === selectedCategory;
      const matchesAge =
        selectedAge === "" || selectedAge === "All" || toy.age === selectedAge;
      const matchesBrand =
        selectedBrand === "" ||
        selectedBrand === "All" ||
        toy.brand === selectedBrand;

      let matchesPrice = true;
      if (selectedPrice === "Under $20")
        matchesPrice =
          toy.price && typeof toy.price === "string"
            ? parseInt(toy.price.replace(/[^0-9]/g, "")) < 20
            : false;
      else if (selectedPrice === "$20-$30")
        matchesPrice =
          toy.price && typeof toy.price === "string"
            ? parseInt(toy.price.replace(/[^0-9]/g, "")) >= 20 &&
              parseInt(toy.price.replace(/[^0-9]/g, "")) <= 30
            : false;
      else if (selectedPrice === "$30-$40")
        matchesPrice =
          toy.price && typeof toy.price === "string"
            ? parseInt(toy.price.replace(/[^0-9]/g, "")) >= 30 &&
              parseInt(toy.price.replace(/[^0-9]/g, "")) <= 40
            : false;
      else if (selectedPrice === "$40-$50")
        matchesPrice =
          toy.price && typeof toy.price === "string"
            ? parseInt(toy.price.replace(/[^0-9]/g, "")) >= 40 &&
              parseInt(toy.price.replace(/[^0-9]/g, "")) <= 50
            : false;
      else if (selectedPrice === "Over $50")
        matchesPrice =
          toy.price && typeof toy.price === "string"
            ? parseInt(toy.price.replace(/[^0-9]/g, "")) > 50
            : false;

      let matchesEducationalValue = true;
      if (selectedEducationalValue === "High (5)")
        matchesEducationalValue = toy.educationalValue === 5;
      else if (selectedEducationalValue === "Medium (4)")
        matchesEducationalValue = toy.educationalValue === 4;
      else if (selectedEducationalValue === "Low (3)")
        matchesEducationalValue = toy.educationalValue === 3;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAge &&
        matchesBrand &&
        matchesPrice &&
        matchesEducationalValue
      );
    });

    // Sort toys
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

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
        case "educationalValue":
          aValue = a.educationalValue;
          bValue = b.educationalValue;
          break;
        case "reviews":
          aValue = a.reviews;
          bValue = b.reviews;
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
    selectedBrand,
    selectedPrice,
    selectedEducationalValue,
    sortBy,
    sortOrder,
    toys,
  ]);

  // Guest users see only 2 results, authenticated users see paginated results
  const isGuest = !user && !authLoading;
  const guestLimit = 2;
  const maxResults = isGuest ? guestLimit : resultsPerPage;

  // Calculate pagination
  const totalPages = Math.ceil(filteredToys.length / maxResults);
  const startIndex = (currentPage - 1) * maxResults;
  const endIndex = startIndex + maxResults;
  const displayedToys = filteredToys.slice(startIndex, endIndex);
  const hasMoreResults = filteredToys.length > maxResults;

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
    selectedBrand,
    selectedPrice,
    selectedEducationalValue,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedAge("");
    setSelectedBrand("");
    setSelectedPrice("");
    setSelectedEducationalValue("");
  };

  const toggleWishlist = (toyId: number) => {
    setWishlist((prev) =>
      prev.includes(toyId)
        ? prev.filter((id) => id !== toyId)
        : [...prev, toyId]
    );
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
              <span className="text-gray-900 font-medium">
                Developmental Toys
              </span>
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
                Developmental Toys
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Discover educational toys and learning materials designed to
              support your child&apos;s growth and development.
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
                  placeholder="Search for toys, brands, or learning objectives..."
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
                <option value="educationalValue">
                  Sort by Educational Value
                </option>
                <option value="reviews">Sort by Reviews</option>
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

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
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

                {/* Educational Value Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Educational Value
                  </label>
                  <select
                    value={selectedEducationalValue}
                    onChange={(e) =>
                      setSelectedEducationalValue(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {educationalValues.map((value) => (
                      <option key={value} value={value}>
                        {value}
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
                  <span className="font-semibold">{displayedToys.length}</span>{" "}
                  of{" "}
                  <span className="font-semibold">{filteredToys.length}</span>{" "}
                  developmental toys
                  <span className="text-orange-600 font-medium">
                    {" "}
                    (Sign in to see all {filteredToys.length} results)
                  </span>
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold">{displayedToys.length}</span>{" "}
                  of{" "}
                  <span className="font-semibold">{filteredToys.length}</span>{" "}
                  developmental toys
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
              selectedBrand,
              selectedPrice,
              selectedEducationalValue,
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

      {/* Developmental Toys Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {displayedToys.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No toys found
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedToys.map((toy, index) => (
                <motion.div
                  key={toy.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">{toy.image}</div>
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {toy.category}
                        </span>
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {toy.brand}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                      {toy.name}
                    </h3>

                    {/* Rating and Reviews */}
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(toy.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({toy.reviews})
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 text-center">
                      {toy.description}
                    </p>

                    {/* Learning Objectives */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Learning Objectives:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {toy.learningObjectives.map((objective, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {objective}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Features:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {toy.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="mb-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span>Safety: {toy.safetyRating}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span>Educational Value: {toy.educationalValue}/5</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-purple-600" />
                        <span>{toy.shipping}</span>
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold text-blue-600">
                            {toy.price}
                          </span>
                          <p className="text-sm text-gray-500">
                            {toy.warranty} warranty
                          </p>
                        </div>
                        <button
                          onClick={() => toggleWishlist(toy.id)}
                          className={`p-2 rounded-full transition-colors ${
                            wishlist.includes(toy.id)
                              ? "text-red-500 hover:text-red-600"
                              : "text-gray-400 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              wishlist.includes(toy.id) ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                            toy.inStock
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-400 text-gray-600 cursor-not-allowed"
                          }`}
                          disabled={!toy.inStock}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>
                            {toy.inStock ? "Add to Cart" : "Out of Stock"}
                          </span>
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
              Want to Sell Your Developmental Toys?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Are you a toy manufacturer or retailer? Join our platform and
              reach thousands of families looking for quality developmental
              toys.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/provider/register"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Become a Seller
              </Link>
              <Link
                href="/classes"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Classes
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
              Unlock All {filteredToys.length} Developmental Toys
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              You&apos;re seeing only 2 of {filteredToys.length} developmental
              toys. Sign up for free to access all results, save favorites, and
              get personalized recommendations.
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
