import type { EnrollmentRecord } from "@/lib/enrollmentsService";
import {
  enrollmentStatusLabel,
  getEnrollmentQueueStatus,
} from "@/lib/enrollmentsService";

function badgeClassForQueueStatus(queueStatus: string): string {
  switch (queueStatus) {
    case "submitted":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "failed":
      return "bg-red-50 text-red-800 border-red-200";
    case "pending_automation":
    case "running":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "draft":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "not_started":
      return "bg-gray-50 text-gray-600 border-gray-200";
    default:
      return "bg-amber-50 text-amber-900 border-amber-200";
  }
}

export default function EnrollmentStatusBadge({
  record,
}: {
  record: EnrollmentRecord;
}) {
  const queueStatus = getEnrollmentQueueStatus(record);
  const label = enrollmentStatusLabel(record);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClassForQueueStatus(queueStatus)}`}
    >
      {label}
    </span>
  );
}
