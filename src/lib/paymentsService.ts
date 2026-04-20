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
