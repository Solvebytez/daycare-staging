'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Heart,
  MapPin,
  Phone,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { formatDaycarePrice } from '@/utils/priceFormatter';
import { useFavorites } from '@/hooks/useFavorites';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  maxChildren: number;
  currentChildren: number;
  isActive: boolean;
}


interface Daycare {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  rating: number;
  price: string | number;
  priceString?: string;
  features: string[];
  ageRange: string;
  hours: string;
  images?: string[];
}

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    favorites: apiFavorites,
    isLoading: favoritesLoading,
    removeFavorite: removeFavoriteAPI,
  } = useFavorites();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    startTime: '08:00',
    endTime: '17:00',
    maxChildren: 10
  });

  // Authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.push('/login');
      } else if (user.userType !== 'provider') {
        // Logged in but not a provider - redirect to appropriate dashboard
        router.push('/parent/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Sample data
  useEffect(() => {
    setAvailability([
      { id: '1', day: 'Monday', startTime: '08:00', endTime: '17:00', maxChildren: 15, currentChildren: 12, isActive: true },
      { id: '2', day: 'Tuesday', startTime: '08:00', endTime: '17:00', maxChildren: 15, currentChildren: 14, isActive: true },
      { id: '3', day: 'Wednesday', startTime: '08:00', endTime: '17:00', maxChildren: 15, currentChildren: 11, isActive: true },
      { id: '4', day: 'Thursday', startTime: '08:00', endTime: '17:00', maxChildren: 15, currentChildren: 13, isActive: true },
      { id: '5', day: 'Friday', startTime: '08:00', endTime: '17:00', maxChildren: 15, currentChildren: 10, isActive: true },
    ]);
  }, []);

  // Transform API favorites to Daycare format
  const favorites = useMemo((): Daycare[] => {
    if (!apiFavorites || apiFavorites.length === 0) {
      return [];
    }

    return apiFavorites
      .filter((favorite) => favorite.daycare) // Filter out favorites without daycare data
      .map((favorite) => {
        const daycare = favorite.daycare!;
        const daycareId = daycare._id || daycare.id || favorite.daycareId;

        return {
          id: daycareId,
          name: daycare.name || "Unnamed KinderBridge",
          city: daycare.city || "",
          address: daycare.address || "",
          phone: (daycare.phone as string) || "",
          email: (daycare.email as string | undefined) || "",
          rating: (daycare.rating as number) || 0,
          price: daycare.price || daycare.monthlyFee || 0,
          priceString: daycare.priceString as string | undefined,
          features: (daycare.features as string[]) || [],
          ageRange: (daycare.ageRange as string) || "",
          hours: daycare.hours as string || "",
          images: (daycare.images as string[]) || [],
          description: (daycare.description as string) || "",
        };
      });
  }, [apiFavorites]);

  const removeFavorite = (id: string) => {
    removeFavoriteAPI(id);
  };

  const addTimeSlot = () => {
    if (newSlot.startTime && newSlot.endTime && newSlot.maxChildren > 0) {
      const slot: TimeSlot = {
        id: Date.now().toString(),
        day: newSlot.day,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        maxChildren: newSlot.maxChildren,
        currentChildren: 0,
        isActive: true
      };
      setAvailability([...availability, slot]);
      setNewSlot({ day: 'Monday', startTime: '08:00', endTime: '17:00', maxChildren: 10 });
      setShowAddSlot(false);
    }
  };

  const toggleSlotStatus = (id: string) => {
    setAvailability(availability.map(slot => 
      slot.id === id ? { ...slot, isActive: !slot.isActive } : slot
    ));
  };

  const deleteSlot = (id: string) => {
    setAvailability(availability.filter(slot => slot.id !== id));
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

  // Not authenticated or wrong user type
  if (!user || user.userType !== 'provider') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">This dashboard is only available for provider accounts.</p>
          <Link 
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'availability', label: 'Availability', icon: Calendar },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'profile', label: 'Profile', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Children</p>
                    <p className="text-2xl font-bold text-gray-900">67</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Days</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Favorites</p>
                    <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Operating Hours</p>
                    <p className="text-2xl font-bold text-gray-900">9h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">New enrollment: Emma Thompson (Age 4)</span>
                  <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Schedule change request from Mike Chen</span>
                  <span className="text-xs text-gray-400 ml-auto">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Payment received: $1,200 monthly fee</span>
                  <span className="text-xs text-gray-400 ml-auto">2 days ago</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'availability' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Add New Time Slot */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Availability</h3>
                <button
                  onClick={() => setShowAddSlot(!showAddSlot)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Time Slot</span>
                </button>
              </div>

              {showAddSlot && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={newSlot.day}
                      onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max Children"
                      value={newSlot.maxChildren}
                      onChange={(e) => setNewSlot({ ...newSlot, maxChildren: parseInt(e.target.value) })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={addTimeSlot}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4 inline mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => setShowAddSlot(false)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4 inline mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Time Slots List */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Current Schedule</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {availability.map((slot) => (
                  <div key={slot.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${slot.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{slot.day}</h4>
                          <p className="text-sm text-gray-600">
                            {slot.startTime} - {slot.endTime} • {slot.currentChildren}/{slot.maxChildren} children
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSlotStatus(slot.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            slot.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {slot.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'favorites' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Favorites Header */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Favorites</h3>
                  <p className="text-sm text-gray-500 mt-1">Daycares you&apos;ve saved for later</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-600">{favorites.length} saved</span>
                </div>
              </div>
            </div>

            {/* Favorites List */}
            {favoritesLoading ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading favorites...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h4>
                <p className="text-gray-500 mb-6">Start browsing daycares and save your favorites here.</p>
                <Link
                  href="/search"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Daycares
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((daycare) => (
                  <div key={daycare.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-r from-blue-100 to-purple-100">
                      {daycare.images && daycare.images[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={daycare.images[0]} 
                          alt={daycare.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-12 w-12 text-blue-300" />
                        </div>
                      )}
                      <button
                        onClick={() => removeFavorite(daycare.id)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        title="Remove from favorites"
                      >
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{daycare.name}</h4>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{daycare.city}</span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-700">{daycare.rating}</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatDaycarePrice(daycare.price, daycare.priceString)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{daycare.hours}</span>
                      </div>

                      {daycare.phone && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>{daycare.phone}</span>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Link
                          href={`/daycare/${daycare.id}`}
                          className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => removeFavorite(daycare.id)}
                          className="px-4 py-2 text-red-600 bg-red-50 text-sm rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daycare Name</label>
                  <input
                    type="text"
                    defaultValue="Bright Beginnings Daycare"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    defaultValue="Jennifer Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue="(416) 555-0123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="jennifer@brightbeginnings.ca"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    defaultValue="123 Main Street, Toronto, ON M5V 3A8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    defaultValue="Bright Beginnings Daycare provides a nurturing environment where children can learn, grow, and develop essential skills through play-based learning and structured activities."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
