import type { EnrollmentPayload } from "./enrollmentsService";

export function splitFullName(fullName: string) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "", middle_name: "", last_name: "" };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], middle_name: "", last_name: "" };
  }
  if (parts.length === 2) {
    return { first_name: parts[0], middle_name: "", last_name: parts[1] };
  }
  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

export function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function num(v: unknown): number | "" {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return "";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isPlainObject(source)) return source;
  const base: Record<string, unknown> = isPlainObject(target) ? { ...target } : {};
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = base[key];
    if (isPlainObject(sv) && isPlainObject(tv)) {
      base[key] = deepMerge(tv, sv);
    } else {
      base[key] = sv;
    }
  }
  return base;
}

/** Deep-merge partial enrollment payload (for section saves in UI). */
export function mergeEnrollmentPayload(
  prev: EnrollmentPayload,
  partial: Partial<EnrollmentPayload>
): EnrollmentPayload {
  if (partial.secondary_parent === null) {
    return { ...prev, ...partial, secondary_parent: null };
  }
  return deepMerge(prev, partial) as EnrollmentPayload;
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type EnrollmentSectionId =
  | "child"
  | "primary_parent"
  | "secondary_parent"
  | "enrollment"
  | "emergency"
  | "health"
  | "education"
  | "household"
  | "additional"
  | "consents";

export const ENROLLMENT_SECTIONS: { id: EnrollmentSectionId; title: string }[] = [
  { id: "child", title: "Child" },
  { id: "primary_parent", title: "Primary parent" },
  { id: "secondary_parent", title: "Second parent" },
  { id: "enrollment", title: "Enrollment" },
  { id: "emergency", title: "Emergency contacts" },
  { id: "health", title: "Health" },
  { id: "education", title: "Education" },
  { id: "household", title: "Household" },
  { id: "additional", title: "More info" },
  { id: "consents", title: "Consents" },
];

/** Human-readable labels for API missing field paths */
export function missingFieldLabel(path: string): string {
  const map: Record<string, string> = {
    "child.first_name": "Child — first name",
    "child.last_name": "Child — last name",
    "child.date_of_birth": "Child — date of birth",
    "primary_parent.first_name": "Primary parent — first name",
    "primary_parent.last_name": "Primary parent — last name",
    "primary_parent.email": "Primary parent — email",
    "primary_parent.phone": "Primary parent — phone",
    "primary_parent.address.street": "Primary parent — street address",
    "primary_parent.address.city": "Primary parent — city",
    "primary_parent.address.province": "Primary parent — province (e.g. ON)",
    "primary_parent.address.postal_code": "Primary parent — postal code",
    "enrollment.program_type": "Enrollment — program type",
    "enrollment.start_date": "Enrollment — start date",
    "enrollment.schedule_type": "Enrollment — schedule",
    "consent_and_declarations.parent_declaration": "Parent declaration",
    "consent_and_declarations.privacy_policy": "Privacy policy",
    "consent_and_declarations.terms_and_conditions": "Terms and conditions",
    "form_metadata.form_url": "Daycare form URL (contact support)",
  };
  return map[path] || path.replaceAll("_", " ").replaceAll(".", " → ");
}
