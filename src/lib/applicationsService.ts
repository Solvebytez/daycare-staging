import { apiClient } from "./api";
import type { EnrollmentPayload } from "./enrollmentsService";

/**
 * Applications Service
 * Handles all applications API calls
 */

export interface ApplicationResponse {
  _id: string;
  userId: string;
  daycareId: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  childAge: string;
  daycareType: string;
  startDate: string;
  maxMonthlyFee?: string;
  postalCode?: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  additionalNotes?: string;
  source?: "manual" | "auto_apply";
  childName?: string;
  childDob?: string;
  preferredStartDate?: string;
  specialNotes?: string;
  createdAt: string;
  updatedAt: string;
  daycare?: {
    _id?: string;
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    price?: string;
    monthlyFee?: number;
    image?: string;
    [key: string]: unknown;
  };
}

export interface CreateApplicationRequest {
  daycareId: string;
  childAge: string;
  daycareType: string;
  startDate: string;
  maxMonthlyFee?: string;
  postalCode?: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  additionalNotes?: string;
}

export interface AutoApplyCreditsResponse {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
}

export interface SubmitAutoApplyRequest {
  daycareIds: string[];
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childDob: string;
  preferredStartDate: string;
  specialNotes?: string;
  /** Optional fields from 3-step form — merged into enrollment on the server */
  enrollmentPayload?: Partial<EnrollmentPayload>;
}

export interface ApplicationsApiResponse {
  success: boolean;
  data: ApplicationResponse[];
  metadata?: {
    totalCount: number;
    timestamp: string;
  };
}

/**
 * Create a new application
 */
export const createApplication = async (
  applicationData: CreateApplicationRequest
): Promise<{
  success: boolean;
  data: ApplicationResponse;
  message?: string;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: ApplicationResponse;
    message?: string;
  }>("/api/applications", applicationData);
  return response.data;
};

/**
 * Get user's applications
 */
export const getUserApplications =
  async (): Promise<ApplicationsApiResponse> => {
    const response = await apiClient.get<ApplicationsApiResponse>(
      "/api/applications"
    );
    return response.data;
  };

/**
 * Get application by ID
 */
export const getApplicationById = async (
  applicationId: string
): Promise<{ success: boolean; data: ApplicationResponse }> => {
  const response = await apiClient.get<{
    success: boolean;
    data: ApplicationResponse;
  }>(`/api/applications/${applicationId}`);
  return response.data;
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  status: "pending" | "accepted" | "rejected" | "withdrawn"
): Promise<{
  success: boolean;
  data: ApplicationResponse;
  message?: string;
}> => {
  const response = await apiClient.put<{
    success: boolean;
    data: ApplicationResponse;
    message?: string;
  }>(`/api/applications/${applicationId}/status`, { status });
  return response.data;
};

/**
 * Delete an application
 */
export const deleteApplication = async (
  applicationId: string
): Promise<{
  success: boolean;
  data: { deleted: boolean; id: string };
  message?: string;
}> => {
  const response = await apiClient.delete<{
    success: boolean;
    data: { deleted: boolean; id: string };
    message?: string;
  }>(`/api/applications/${applicationId}`);
  return response.data;
};

export const getAutoApplyCredits = async (): Promise<{
  success: boolean;
  data: AutoApplyCreditsResponse;
}> => {
  const response = await apiClient.get<{
    success: boolean;
    data: AutoApplyCreditsResponse;
  }>("/api/applications/credits");
  return response.data;
};

export const grantAutoApplyCredits = async (payload: {
  credits?: number;
  paymentReference?: string;
  note?: string;
}): Promise<{
  success: boolean;
  data: AutoApplyCreditsResponse & { grantedCredits: number };
  message?: string;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: AutoApplyCreditsResponse & { grantedCredits: number };
    message?: string;
  }>("/api/applications/credits/grant", payload);
  return response.data;
};

function logAutoApplyRequest(payload: SubmitAutoApplyRequest) {
  if (process.env.NODE_ENV !== "development") return;
  const ep = payload.enrollmentPayload;
  const addr =
    ep?.primary_parent && typeof ep.primary_parent === "object"
      ? (ep.primary_parent as { address?: Record<string, string> }).address
      : undefined;
  // eslint-disable-next-line no-console
  console.info("[auto-apply] POST /api/applications/auto-apply", {
    daycareCount: payload.daycareIds?.length ?? 0,
    parentName: payload.parentName,
    parentEmail: payload.parentEmail,
    childName: payload.childName,
    hasEnrollmentPayload: Boolean(ep && Object.keys(ep).length > 0),
    enrollmentTopLevelKeys: ep ? Object.keys(ep) : [],
    addressStreet: addr?.street,
    addressCity: addr?.city,
    jobTitle:
      ep?.primary_parent && typeof ep.primary_parent === "object"
        ? (ep.primary_parent as { employment?: { job_title?: string } }).employment
            ?.job_title
        : undefined,
    preferredLanguage: ep?.form_metadata?.preferred_language,
    childGender: ep?.child && typeof ep.child === "object" ? (ep.child as { gender?: string }).gender : undefined,
    daysRequired: ep?.enrollment && typeof ep.enrollment === "object"
      ? (ep.enrollment as { days_required?: string[] }).days_required
      : undefined,
    photoConsent:
      ep?.health_and_wellness && typeof ep.health_and_wellness === "object"
        ? (ep.health_and_wellness as { photo_consent?: boolean }).photo_consent
        : undefined,
  });
}

export const submitAutoApplyApplications = async (
  payload: SubmitAutoApplyRequest
): Promise<{
  success: boolean;
  data: {
    createdCount: number;
    skippedCount: number;
    createdIds: string[];
    skippedDaycareIds: string[];
    credits: AutoApplyCreditsResponse | null;
  };
  message?: string;
  error?: string;
  details?: Array<{ remainingCredits?: number; creditsNeeded?: number }>;
}> => {
  logAutoApplyRequest(payload);
  const response = await apiClient.post<{
    success: boolean;
    data: {
      createdCount: number;
      skippedCount: number;
      createdIds: string[];
      skippedDaycareIds: string[];
      credits: AutoApplyCreditsResponse | null;
    };
    message?: string;
    error?: string;
    details?: Array<{ remainingCredits?: number; creditsNeeded?: number }>;
  }>("/api/applications/auto-apply", payload);
  return response.data;
};
