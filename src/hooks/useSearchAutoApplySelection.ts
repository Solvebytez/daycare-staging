"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  clearSearchSelection,
  getSearchSelectionContextUrl,
  normalizeSearchSelectionUrl,
  readLastSearchUrl,
  readSearchSelection,
  returnUrlsMatch,
  saveAutoApplyPending,
  saveSearchSelection,
} from "@/lib/autoApplyPending";
import { getUserApplications } from "@/lib/applicationsService";
import { getAutoApplyBlockedDaycareIds } from "@/lib/autoApplyDuplicateDaycares";

type AuthSlice = {
  user: { _id?: string } | null;
  authLoading: boolean;
};

export function useSearchAutoApplySelection({ user, authLoading }: AuthSlice) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [backToSearchHref, setBackToSearchHref] = useState("/search");
  const hydratedRef = useRef(false);

  const { data: myApplicationsForAutoApply } = useQuery({
    queryKey: ["userApplications", "autoApplyBlocks", user?._id],
    queryFn: () => getUserApplications(),
    enabled: Boolean(user && !authLoading),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const blockedDaycareIds = useMemo(() => {
    if (
      !myApplicationsForAutoApply?.success ||
      !Array.isArray(myApplicationsForAutoApply.data)
    ) {
      return new Set<string>();
    }
    return getAutoApplyBlockedDaycareIds(myApplicationsForAutoApply.data);
  }, [myApplicationsForAutoApply]);

  useLayoutEffect(() => {
    setBackToSearchHref(readLastSearchUrl());
    const context = getSearchSelectionContextUrl();
    const stored = readSearchSelection();
    if (
      stored &&
      returnUrlsMatch(normalizeSearchSelectionUrl(stored.returnUrl), context)
    ) {
      if (stored.selectedDaycareIds.length > 0) {
        setSelectedIds(stored.selectedDaycareIds);
      }
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    const returnUrl = getSearchSelectionContextUrl();
    if (selectedIds.length === 0) {
      clearSearchSelection();
      return;
    }
    saveSearchSelection({
      returnUrl,
      selectedDaycareIds: selectedIds,
    });
  }, [selectedIds]);

  useEffect(() => {
    if (!user || blockedDaycareIds.size === 0) return;
    if (!hydratedRef.current) return;
    setSelectedIds((prev) => {
      const next = prev.filter(
        (x) => !blockedDaycareIds.has(String(x).trim())
      );
      if (next.length < prev.length) {
        toast("Removed daycares you already applied to from your selection.", {
          icon: "ℹ️",
          duration: 4500,
        });
      }
      return next;
    });
  }, [user, blockedDaycareIds]);

  const toggleSelect = useCallback(
    (id: string) => {
      const normalized = String(id).trim();
      setSelectedIds((prev) => {
        const isSelected = prev.some((x) => String(x).trim() === normalized);
        if (isSelected) {
          return prev.filter((x) => String(x).trim() !== normalized);
        }
        if (user && blockedDaycareIds.has(normalized)) {
          toast.error(
            "You already have a pending or accepted application for this daycare. Choose another location.",
            { duration: 4500 }
          );
          return prev;
        }
        return [...prev, id];
      });
    },
    [user, blockedDaycareIds]
  );

  const isSelected = useCallback(
    (id: string) =>
      selectedIds.some((x) => String(x).trim() === String(id).trim()),
    [selectedIds]
  );

  const proceedToAutoApply = useCallback(() => {
    const idsToSend = [...new Set(selectedIds)]
      .map((id) => String(id).trim())
      .filter(Boolean)
      .filter((id) => !blockedDaycareIds.has(id));

    if (idsToSend.length === 0) {
      toast.error(
        "No new daycares to apply to — your selection only includes locations you already applied to.",
        { duration: 5000 }
      );
      return;
    }
    if (authLoading) return;

    const returnUrl = readLastSearchUrl();

    if (user) {
      const selectedIdsParam = encodeURIComponent(idsToSend.join(","));
      router.push(`/parent-details?selectedIds=${selectedIdsParam}`);
      return;
    }

    saveAutoApplyPending({
      returnUrl,
      selectedDaycareIds: idsToSend,
    });
    try {
      localStorage.setItem("searchRedirectUrl", returnUrl);
    } catch {
      /* ignore */
    }
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  }, [selectedIds, blockedDaycareIds, user, authLoading, router]);

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    toggleSelect,
    isSelected,
    proceedToAutoApply,
    blockedDaycareIds,
    backToSearchHref,
  };
}
