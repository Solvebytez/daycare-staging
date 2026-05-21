"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import EnrollmentFormWizard from "@/components/enrollment/EnrollmentFormWizard";
import EnrollmentStatusBadge from "@/components/enrollment/EnrollmentStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  ensureEnrollmentDraft,
  getEnrollmentByApplicationId,
  patchEnrollment,
  queueEnrollmentAutomation,
  validateEnrollment,
  enrollmentStatusLabel,
  type EnrollmentPayload,
  type EnrollmentRecord,
} from "@/lib/enrollmentsService";
import { Loader } from "lucide-react";

export default function EnrollmentFormPage() {
  const params = useParams();
  const applicationId = String(params.applicationId || "");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [record, setRecord] = useState<EnrollmentRecord | null>(null);
  const [payload, setPayload] = useState<EnrollmentPayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const refreshValidation = async (enrollmentId: string) => {
    const v = await validateEnrollment(enrollmentId);
    if (v.success && v.data) {
      setMissingFields(v.data.missingFields || []);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await getEnrollmentByApplicationId(applicationId);
      if (!res.success) {
        res = await ensureEnrollmentDraft(applicationId);
      }
      if (!res.success || !res.data) {
        throw new Error(res.error || "Could not load enrollment");
      }
      setRecord(res.data);
      setPayload(res.data.payload || {});
      await refreshValidation(res.data._id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/enrollment/${applicationId}`)}`
      );
      return;
    }
    if (user) load();
  }, [user, authLoading, applicationId, load, router]);

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await patchEnrollment(record._id, payload);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Save failed");
      }
      setRecord(res.data);
      setPayload(res.data.payload || {});
      setMessage("Saved.");
      await refreshValidation(record._id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitToDaycare = async () => {
    if (!record) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const saveRes = await patchEnrollment(record._id, payload);
      if (!saveRes.success || !saveRes.data) {
        throw new Error(saveRes.error || "Save failed");
      }
      setRecord(saveRes.data);
      setPayload(saveRes.data.payload || {});

      const v = await validateEnrollment(record._id);
      if (!v.success || !v.data?.valid) {
        setMissingFields(v.data?.missingFields || []);
        throw new Error("Please complete all required fields before submitting.");
      }

      const q = await queueEnrollmentAutomation(record._id);
      if (!q.success) {
        throw new Error(q.error || "Could not queue submission");
      }
      if (q.data) {
        setRecord(q.data);
        setPayload(q.data.payload || {});
      }
      setMessage(q.message || "Queued for daycare registration.");
      await refreshValidation(record._id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const serviceName = payload.form_metadata?.service_name || "Daycare";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Navigation />
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Navigation />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-red-700">{error || "Enrollment not found."}</p>
          <Link href="/enrollments" className="mt-4 inline-block text-indigo-600">
            Back to registrations
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/enrollments"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← All registrations
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Complete registration — {serviceName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EnrollmentStatusBadge record={record} />
            <span className="text-sm text-slate-500">
              {enrollmentStatusLabel(record)}
            </span>
          </div>
          {record.automationStatus === "failed" && record.n8n?.lastError && (
            <p className="mt-2 text-sm text-red-700">{record.n8n.lastError}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        <EnrollmentFormWizard
          record={record}
          payload={payload}
          setPayload={setPayload}
          missingFields={missingFields}
          saving={saving}
          submitting={submitting}
          onSave={handleSave}
          onSubmit={handleSubmitToDaycare}
        />
      </main>
    </div>
  );
}
