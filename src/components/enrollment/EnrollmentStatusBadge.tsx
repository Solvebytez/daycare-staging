import type { EnrollmentRecord } from "@/lib/enrollmentsService";
import { enrollmentStatusLabel } from "@/lib/enrollmentsService";

function badgeClass(record: EnrollmentRecord): string {
  if (record.automationStatus === "submitted") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (record.automationStatus === "failed") {
    return "bg-red-50 text-red-800 border-red-200";
  }
  if (record.automationStatus === "queued" || record.automationStatus === "running") {
    return "bg-blue-50 text-blue-800 border-blue-200";
  }
  if (record.completionStatus === "complete") {
    return "bg-indigo-50 text-indigo-800 border-indigo-200";
  }
  if (record.completionStatus === "in_progress") {
    return "bg-amber-50 text-amber-900 border-amber-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function EnrollmentStatusBadge({
  record,
}: {
  record: EnrollmentRecord;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass(record)}`}
    >
      {enrollmentStatusLabel(record)}
    </span>
  );
}
