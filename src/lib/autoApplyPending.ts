const AUTO_APPLY_PENDING_KEY = "kb_auto_apply_pending_v1";

export type AutoApplyPendingPayload = {
  v: 1;
  returnUrl: string;
  selectedDaycareIds: string[];
  savedAt: number;
};

export function saveAutoApplyPending(
  payload: Pick<AutoApplyPendingPayload, "returnUrl" | "selectedDaycareIds">
): void {
  if (typeof window === "undefined") return;
  const full: AutoApplyPendingPayload = {
    v: 1,
    returnUrl: payload.returnUrl,
    selectedDaycareIds: payload.selectedDaycareIds,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(AUTO_APPLY_PENDING_KEY, JSON.stringify(full));
}

export function readAutoApplyPending(): AutoApplyPendingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTO_APPLY_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutoApplyPendingPayload;
    if (
      parsed.v !== 1 ||
      typeof parsed.returnUrl !== "string" ||
      !Array.isArray(parsed.selectedDaycareIds)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAutoApplyPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTO_APPLY_PENDING_KEY);
}

/** Persisted multi-select on /search (survives refresh while URL matches). */
const SEARCH_SELECTION_KEY = "kb_search_selection_v1";

export type SearchSelectionPersisted = {
  v: 1;
  returnUrl: string;
  selectedDaycareIds: string[];
};

export function saveSearchSelection(
  payload: Pick<SearchSelectionPersisted, "returnUrl" | "selectedDaycareIds">
): void {
  if (typeof window === "undefined") return;
  const full: SearchSelectionPersisted = {
    v: 1,
    returnUrl: payload.returnUrl,
    selectedDaycareIds: payload.selectedDaycareIds,
  };
  sessionStorage.setItem(SEARCH_SELECTION_KEY, JSON.stringify(full));
}

export function readSearchSelection(): SearchSelectionPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SEARCH_SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SearchSelectionPersisted;
    if (
      parsed.v !== 1 ||
      typeof parsed.returnUrl !== "string" ||
      !Array.isArray(parsed.selectedDaycareIds)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSearchSelection(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SEARCH_SELECTION_KEY);
}

/**
 * Search selection key: same filters = same session, ignore pagination `page`.
 */
export function normalizeSearchSelectionUrl(pathAndSearch: string): string {
  try {
    const base = "http://local.test";
    const full = new URL(
      pathAndSearch.startsWith("/") ? `${base}${pathAndSearch}` : pathAndSearch
    );
    if (full.pathname === "/search") {
      full.searchParams.delete("page");
    }
    return full.pathname + (full.search ? full.search : "");
  } catch {
    return pathAndSearch;
  }
}

/** Compare pathname + query (order-insensitive for search params). */
export function returnUrlsMatch(a: string, b: string): boolean {
  try {
    const base = "http://local.test";
    const ua = new URL(a.startsWith("/") ? `${base}${a}` : a);
    const ub = new URL(b.startsWith("/") ? `${base}${b}` : b);
    if (ua.pathname !== ub.pathname) return false;
    const entries = (sp: URLSearchParams) =>
      [...sp.entries()].sort(([x], [y]) => x.localeCompare(y));
    const sa = entries(ua.searchParams).join("\0");
    const sb = entries(ub.searchParams).join("\0");
    return sa === sb;
  } catch {
    return a === b;
  }
}
