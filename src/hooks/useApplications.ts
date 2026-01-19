import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  CreateApplicationRequest,
} from "@/lib/applicationsService";

/**
 * React Query hook for managing user applications
 */
export function useApplications() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: applicationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["applications", user?._id],
    queryFn: async () => {
      return await getUserApplications();
    },
    enabled: !!user && !authLoading, // Only fetch if user is logged in
    staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: (applicationData: CreateApplicationRequest) =>
      createApplication(applicationData),
    onSuccess: () => {
      // Invalidate and refetch applications
      queryClient.invalidateQueries({
        queryKey: ["applications", user?._id],
      });
    },
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: "pending" | "accepted" | "rejected" | "withdrawn";
    }) => updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      // Invalidate and refetch applications
      queryClient.invalidateQueries({
        queryKey: ["applications", user?._id],
      });
    },
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => deleteApplication(applicationId),
    onSuccess: () => {
      // Invalidate and refetch applications
      queryClient.invalidateQueries({
        queryKey: ["applications", user?._id],
      });
    },
  });

  return {
    applications: applicationsResponse?.data || [],
    isLoading,
    error,
    refetch,
    createApplication: createApplicationMutation.mutate,
    createApplicationAsync: createApplicationMutation.mutateAsync,
    updateApplicationStatus: updateStatusMutation.mutate,
    isCreatingApplication: createApplicationMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    createApplicationMutation, // Expose full mutation object for callbacks
    deleteApplication: deleteApplicationMutation.mutate,
    deleteApplicationAsync: deleteApplicationMutation.mutateAsync,
    isDeletingApplication: deleteApplicationMutation.isPending,
  };
}


