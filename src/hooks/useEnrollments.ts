import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { listMyEnrollments, type EnrollmentRecord } from "@/lib/enrollmentsService";

export function useEnrollments() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["enrollments", user?._id],
    queryFn: async () => {
      const res = await listMyEnrollments();
      if (!res.success) {
        throw new Error(res.error || "Failed to load enrollments");
      }
      return res.data ?? [];
    },
    enabled: !!user && !authLoading,
    staleTime: 60 * 1000,
  });

  const byApplicationId = new Map<string, EnrollmentRecord>();
  for (const item of query.data ?? []) {
    if (item.applicationId) {
      byApplicationId.set(item.applicationId, item);
    }
  }

  return {
    enrollments: query.data ?? [],
    byApplicationId,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
