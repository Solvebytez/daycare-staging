import { apiClient } from "./api";

export interface CreateIntentRequest {
  daycareIds: string[];
}

export interface CreateIntentResponseData {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  creditsToGrant: number;
}

export interface PaymentStatusData {
  paymentIntentId: string;
  status: "pending" | "completed" | "failed" | string;
  creditsGranted: number;
  processedAt: string | null;
}

export const createAutoApplyPaymentIntent = async (
  payload: CreateIntentRequest
): Promise<{ success: boolean; data: CreateIntentResponseData; error?: string }> => {
  const response = await apiClient.post<{
    success: boolean;
    data: CreateIntentResponseData;
    error?: string;
  }>("/api/payments/create-intent", payload);

  return response.data;
};

export const getPaymentStatus = async (
  paymentIntentId: string
): Promise<{ success: boolean; data: PaymentStatusData; error?: string }> => {
  const response = await apiClient.get<{
    success: boolean;
    data: PaymentStatusData;
    error?: string;
  }>(`/api/payments/status/${paymentIntentId}`, {
    params: { _t: Date.now() },
  });

  return response.data;
};

/** Call after Stripe confirms payment if webhook may not have run yet (local dev). */
export const reconcilePaymentAfterSuccess = async (
  paymentIntentId: string
): Promise<{ success: boolean; data?: { reconciled?: boolean }; error?: string }> => {
  const response = await apiClient.post<{
    success: boolean;
    data?: { reconciled?: boolean };
    error?: string;
  }>("/api/payments/reconcile", { paymentIntentId });
  return response.data;
};

export interface PurchaseRecord {
  _id: string;
  userId: string;
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled" | string;
  paymentType?: string;
  amount?: number;
  currency?: string;
  stripePaymentId?: string | null;
  paymentIntentId?: string | null;
  daycareId?: string | null;
  daycareIds?: string[];
  creditsGranted?: number;
  processedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const listUserPurchases = async (params?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<{ success: boolean; data: PurchaseRecord[]; error?: string }> => {
  const response = await apiClient.get<{
    success: boolean;
    data: PurchaseRecord[];
    error?: string;
  }>("/api/payments/purchases", { params });
  return response.data;
};

/** Daycare IDs with a completed non–auto-apply purchase (e.g. full report). */
export function reportPurchasedDaycareIdsFromPurchases(
  purchases: PurchaseRecord[]
): Set<string> {
  const ids = new Set<string>();
  for (const p of purchases) {
    if (String(p.status).toLowerCase() !== "completed") continue;
    const pt = String(p.paymentType || "report").toLowerCase();
    if (pt === "auto_apply_credits") continue;
    if (p.daycareId) {
      const id = String(p.daycareId).trim();
      if (id) ids.add(id);
    }
    const list = Array.isArray(p.daycareIds) ? p.daycareIds : [];
    for (const raw of list) {
      const id = String(raw).trim();
      if (id) ids.add(id);
    }
  }
  return ids;
}
