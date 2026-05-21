"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import EnrollmentStatusBadge from "@/components/enrollment/EnrollmentStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useEnrollments } from "@/hooks/useEnrollments";
import { Loader, ClipboardDocumentListIcon } from "lucide-react";

export default function EnrollmentsListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { enrollments, isLoading, error } = useEnrollments();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/enrollments");
    }
  }, [user, authLoading, router]);

  if (!authLoading && !user) {
    return null;
  }

  const incomplete = enrollments.filter(
    (e) =>
      e.automationStatus !== "submitted" &&
      e.automationStatus !== "queued" &&
      e.automationStatus !== "running"
  );

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-100 p-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daycare registrations</h1>
            <p className="mt-1 text-sm text-slate-600">
              After auto-apply, complete the full registration for each daycare. When
              ready, submit so we can file the daycare&apos;s online form for you.
            </p>
          </div>
        </div>

        {!isLoading && incomplete.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>{incomplete.length}</strong> registration
            {incomplete.length === 1 ? "" : "s"} still need your details.
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-700">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        )}

        {!isLoading && !error && enrollments.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-slate-700 font-medium">No registrations yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Select daycares on search and use Auto-Apply first.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Find daycares
            </Link>
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {enrollments.map((item) => (
            <li
              key={item._id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">
                    {item.payload?.form_metadata?.service_name || "Daycare"}
                  </p>
                  <div className="mt-2">
                    <EnrollmentStatusBadge record={item} />
                  </div>
                  {item.payload?.enrollment?.start_date ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Preferred start: {String(item.payload.enrollment.start_date)}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/enrollment/${item.applicationId}`}
                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {item.automationStatus === "submitted" ? "View" : "Complete"}
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center">
          <Link href="/parent/dashboard?tab=my-daycares" className="text-sm text-indigo-600">
            Back to My Daycares
          </Link>
        </p>
      </main>
    </div>
  );
}
