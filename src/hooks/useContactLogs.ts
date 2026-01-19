import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserContactLogs,
  createContactLog,
  updateContactLog,
  deleteContactLog,
  CreateContactLogRequest,
} from "@/lib/contactLogsService";

/**
 * React Query hook for managing user contact logs
 */
export function useContactLogs() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: contactLogsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contactLogs", user?._id],
    queryFn: async () => {
      return await getUserContactLogs();
    },
    enabled: !!user && !authLoading, // Only fetch if user is logged in
    staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts
  });

  // Create contact log mutation
  const createContactLogMutation = useMutation({
    mutationFn: (contactLogData: CreateContactLogRequest) =>
      createContactLog(contactLogData),
    onSuccess: () => {
      // Invalidate and refetch contact logs
      queryClient.invalidateQueries({
        queryKey: ["contactLogs", user?._id],
      });
    },
  });

  // Update contact log mutation
  const updateContactLogMutation = useMutation({
    mutationFn: ({
      contactLogId,
      updateData,
    }: {
      contactLogId: string;
      updateData: Partial<CreateContactLogRequest>;
    }) => updateContactLog(contactLogId, updateData),
    onSuccess: () => {
      // Invalidate and refetch contact logs
      queryClient.invalidateQueries({
        queryKey: ["contactLogs", user?._id],
      });
    },
  });

  // Delete contact log mutation
  const deleteContactLogMutation = useMutation({
    mutationFn: (contactLogId: string) => deleteContactLog(contactLogId),
    onSuccess: () => {
      // Invalidate and refetch contact logs
      queryClient.invalidateQueries({
        queryKey: ["contactLogs", user?._id],
      });
    },
  });

  return {
    contactLogs: contactLogsResponse?.data || [],
    isLoading,
    error,
    refetch,
    createContactLog: createContactLogMutation.mutate,
    createContactLogAsync: createContactLogMutation.mutateAsync,
    createContactLogMutation, // Expose full mutation object for callbacks
    isCreatingContactLog: createContactLogMutation.isPending,
    updateContactLog: updateContactLogMutation.mutate,
    updateContactLogAsync: updateContactLogMutation.mutateAsync,
    isUpdatingContactLog: updateContactLogMutation.isPending,
    deleteContactLog: deleteContactLogMutation.mutate,
    deleteContactLogAsync: deleteContactLogMutation.mutateAsync,
    isDeletingContactLog: deleteContactLogMutation.isPending,
  };
}


