import { apiClient } from "./api";

/** n8n enrollment payload shape (partial — extended in UI) */
/** Root fields from enrollment_form_queue (when linked). */
export type EnrollmentFormQueueRecord = {
  _id?: string;
  form_metadata?: Record<string, unknown>;
  status?: string | null;
  child?: Record<string, unknown>;
  primary_parent?: Record<string, unknown>;
  [key: string]: unknown;
};

export type EnrollmentPayload = {
  form_metadata?: {
    form_id?: string;
    service_name?: string;
    form_url?: string;
    submission_date?: string | null;
    preferred_language?: string;
  };
  status?: string;
  child?: Record<string, unknown>;
  primary_parent?: Record<string, unknown>;
  secondary_parent?: Record<string, unknown> | null;
  enrollment?: Record<string, unknown>;
  additional_emergency_contacts?: unknown[];
  health_and_wellness?: Record<string, unknown>;
  educational_preferences?: Record<string, unknown>;
  household_information?: Record<string, unknown>;
  additional_information?: Record<string, unknown>;
  consent_and_declarations?: Record<string, boolean>;
};

export type EnrollmentRecord = {
  _id: string;
  applicationId: string;
  userId: string;
  daycareId: string;
  schemaVersion: string;
  enrollmentFormQueueId?: string | null;
  /** Registration form fields; from queue table when enrollmentFormQueueId is set. */
  payload: EnrollmentPayload;
  formQueue?: EnrollmentFormQueueRecord | null;
  completionStatus: "not_started" | "in_progress" | "complete";
  automationStatus:
    | "not_ready"
    | "queued"
    | "running"
    | "submitted"
    | "failed";
  n8n?: {
    runId?: string | null;
    lastError?: string | null;
    lastRunAt?: string | null;
    queuedAt?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ValidateEnrollmentResult = {
  valid: boolean;
  missingFields: string[];
  completionStatus: string;
};

export const listMyEnrollments = async () => {
  const res = await apiClient.get<{
    success: boolean;
    data: EnrollmentRecord[];
    error?: string;
  }>("/api/enrollments/mine");
  return res.data;
};

export const getEnrollmentByApplicationId = async (applicationId: string) => {
  const res = await apiClient.get<{
    success: boolean;
    data: EnrollmentRecord;
    error?: string;
  }>(`/api/enrollments/by-application/${applicationId}`);
  return res.data;
};

export const ensureEnrollmentDraft = async (applicationId: string) => {
  const res = await apiClient.post<{
    success: boolean;
    data: EnrollmentRecord;
    error?: string;
  }>(`/api/enrollments/by-application/${applicationId}`);
  return res.data;
};

export const patchEnrollment = async (
  enrollmentId: string,
  payload: Partial<EnrollmentPayload>
) => {
  const res = await apiClient.patch<{
    success: boolean;
    data: EnrollmentRecord;
    error?: string;
  }>(`/api/enrollments/${enrollmentId}`, { payload });
  return res.data;
};

export const validateEnrollment = async (enrollmentId: string) => {
  const res = await apiClient.post<{
    success: boolean;
    data: ValidateEnrollmentResult;
    error?: string;
  }>(`/api/enrollments/${enrollmentId}/validate`);
  return res.data;
};

export const queueEnrollmentAutomation = async (enrollmentId: string) => {
  const res = await apiClient.post<{
    success: boolean;
    data: EnrollmentRecord;
    error?: string;
    message?: string;
  }>(`/api/enrollments/${enrollmentId}/queue-automation`);
  return res.data;
};

export function enrollmentStatusLabel(record: EnrollmentRecord): string {
  if (record.automationStatus === "submitted") return "Submitted to daycare";
  if (record.automationStatus === "failed") return "Submission failed";
  if (record.automationStatus === "queued" || record.automationStatus === "running") {
    return "Submitting…";
  }
  if (record.completionStatus === "complete") return "Ready to submit";
  if (record.completionStatus === "in_progress") return "Registration incomplete";
  return "Not started";
}
