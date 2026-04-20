export type AutoApplyCheckoutDraft = {
  daycareIds: string[];
  selectedCount: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childDob: string;
  preferredStartDate: string;
  specialNotes?: string;
};

const AUTO_APPLY_CHECKOUT_KEY = "kb_auto_apply_checkout_v1";

export function saveAutoApplyCheckoutDraft(
  payload: AutoApplyCheckoutDraft
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTO_APPLY_CHECKOUT_KEY, JSON.stringify(payload));
}

export function readAutoApplyCheckoutDraft(): AutoApplyCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTO_APPLY_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutoApplyCheckoutDraft;
    if (!Array.isArray(parsed.daycareIds) || typeof parsed.parentName !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAutoApplyCheckoutDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTO_APPLY_CHECKOUT_KEY);
}
