import type { EnrollmentRecord } from "./enrollmentsService";

/** Child name from enrollment API (payload is sourced from enrollment_form_queue when linked). */
export function enrollmentChildDisplayName(
  enrollment: EnrollmentRecord | undefined,
  fallback?: string
): string {
  const child = enrollment?.payload?.child as
    | { first_name?: string; middle_name?: string; last_name?: string }
    | undefined;
  if (child && typeof child === "object") {
    const name = [child.first_name, child.middle_name, child.last_name]
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .join(" ");
    if (name) return name;
  }
  const fb = String(fallback ?? "").trim();
  return fb || "—";
}

/** Daycare label from queue form_metadata when available. */
export function enrollmentDaycareDisplayName(
  enrollment: EnrollmentRecord | undefined,
  fallback: string
): string {
  const meta = (enrollment?.formQueue?.form_metadata ||
    enrollment?.payload?.form_metadata) as { service_name?: string } | undefined;
  const svc = String(meta?.service_name ?? "").trim();
  return svc || fallback;
}
