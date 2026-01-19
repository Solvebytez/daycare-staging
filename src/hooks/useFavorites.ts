import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "@/lib/favoritesService";

/**
 * React Query hook for fetching user favorites
 */
export function useFavorites() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: favoritesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["favorites", user?._id],
    queryFn: async () => {
      return await getFavorites();
    },
    enabled: !!user && !authLoading, // Only fetch if user is logged in
    staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: (daycareId: string) => addFavorite(daycareId),
    onSuccess: () => {
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ["favorites", user?._id] });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (daycareId: string) => removeFavorite(daycareId),
    onSuccess: () => {
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ["favorites", user?._id] });
    },
  });

  return {
    favorites: favoritesResponse?.data || [],
    isLoading,
    error,
    refetch,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    isAddingFavorite: addFavoriteMutation.isPending,
    isRemovingFavorite: removeFavoriteMutation.isPending,
  };
}
