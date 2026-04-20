"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { readSearchSelection } from "../lib/autoApplyPending";
import { saveAutoApplyCheckoutDraft } from "../lib/autoApplyCheckout";
import Navigation from "./Navigation";
import {
  getAutoApplyCredits,
  type AutoApplyCreditsResponse,
} from "../lib/applicationsService";

type FormState = {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childDob: string;
  preferredStartDate: string;
  specialNotes: string;
};

const EMPTY_FORM: FormState = {
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  childName: "",
  childDob: "",
  preferredStartDate: "",
  specialNotes: "",
};

export default function AutoApplyThreeStepForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedDaycareIds, setSelectedDaycareIds] = useState<string[]>([]);
  const [credits, setCredits] = useState<AutoApplyCreditsResponse | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const childDobRef = useRef<HTMLInputElement | null>(null);
  const preferredStartDateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const idsFromQuery =
      searchParams.get("selectedIds") ||
      searchParams.get("ids") ||
      searchParams.get("selected");
    if (idsFromQuery) {
      const parsed = idsFromQuery
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        setSelectedDaycareIds(parsed);
        setSelectedCount(parsed.length);
        return;
      }
    }

    const persisted = readSearchSelection();
    const persistedIds = persisted?.selectedDaycareIds ?? [];
    setSelectedDaycareIds(persistedIds);
    setSelectedCount(persistedIds.length);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const loadCredits = async () => {
      setIsLoadingCredits(true);
      try {
        const response = await getAutoApplyCredits();
        if (isMounted) {
          setCredits(response.data);
        }
      } catch {
        if (isMounted) {
          setSubmitError("Could not load your application credits.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCredits(false);
        }
      }
    };

    loadCredits();
    return () => {
      isMounted = false;
    };
  }, []);

  const progress = useMemo(
    () => [
      step >= 1 ? "bg-indigo-600" : "bg-gray-200",
      step >= 2 ? "bg-indigo-600" : "bg-gray-200",
      step >= 3 ? "bg-indigo-600" : "bg-gray-200",
    ],
    [step]
  );
  const creditCap = credits?.totalCredits ?? 30;
  const availableCredits = credits?.remainingCredits ?? 0;
  const isOverLimit = !isLoadingCredits && selectedCount > availableCredits;
  const badgeClasses = isLoadingCredits
    ? "border-gray-200 bg-gray-50 text-gray-700"
    : isOverLimit
    ? "border-red-100 bg-red-50 text-red-700"
    : "border-green-100 bg-green-50 text-green-700";

  const extractDateDigits = (value: string) => value.replace(/\D/g, "").slice(0, 8);

  const formatDateFromDigits = (digits: string) => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const countDigitsBeforeCaret = (formatted: string, caret: number) =>
    formatted.slice(0, Math.max(0, caret)).replace(/\D/g, "").length;

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const parseUsDate = (value: string): Date | null => {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const candidate = new Date(year, month - 1, day);
    const isValid =
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day;
    return isValid ? candidate : null;
  };

  const isValidDateFormat = (value: string) => {
    const parsed = parseUsDate(value);
    if (!parsed) return false;
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    const year = parsed.getFullYear();
    // Sanity bounds (avoid year 0000 etc.)
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
  };

  const toApiDate = (maskedDate: string) => {
    const parsed = parseUsDate(maskedDate);
    if (!parsed) return maskedDate.replaceAll("/", "-");
    const yyyy = String(parsed.getFullYear());
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    // Backend accepts yyyy-mm-dd
    return `${yyyy}-${mm}-${dd}`;
  };

  const updateField =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const rawValue = e.target.value;
      const nextValue = key === "childDob" || key === "preferredStartDate"
        ? formatDateFromDigits(extractDateDigits(rawValue))
        : rawValue;

      setForm((prev) => ({ ...prev, [key]: nextValue }));
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  const handleDateKeyDown =
    (key: "childDob" | "preferredStartDate") =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const el = e.currentTarget;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (start !== end) return;
      const current = el.value || "";

      // Build digits-only, then remove the digit adjacent to the caret.
      const digits = extractDateDigits(current);
      const digitsBefore = countDigitsBeforeCaret(current, start);

      // Backspace removes previous digit; Delete removes next digit.
      const removeIndex = e.key === "Backspace" ? digitsBefore - 1 : digitsBefore;
      if (removeIndex < 0 || removeIndex >= digits.length) return;

      e.preventDefault();
      const nextDigits = digits.slice(0, removeIndex) + digits.slice(removeIndex + 1);
      const masked = formatDateFromDigits(nextDigits);
      setForm((prev) => ({ ...prev, [key]: masked }));
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      }

      // Restore caret position after state update.
      const inputRef = key === "childDob" ? childDobRef : preferredStartDateRef;
      window.setTimeout(() => {
        const node = inputRef.current;
        if (!node) return;
        // Place caret just after the digits that remain before it.
        const nextFormatted = node.value || "";
        const desiredDigitsBefore =
          e.key === "Backspace" ? Math.max(0, digitsBefore - 1) : digitsBefore;
        // Find caret position in formatted string that matches desiredDigitsBefore.
        let pos = 0;
        let seenDigits = 0;
        while (pos < nextFormatted.length && seenDigits < desiredDigitsBefore) {
          if (/\d/.test(nextFormatted[pos])) seenDigits += 1;
          pos += 1;
        }
        node.setSelectionRange(pos, pos);
      }, 0);
    };

  const goToChildStep = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.parentName.trim()) {
      errors.parentName = "Parent full name is required.";
    }
    if (!form.parentEmail.trim()) {
      errors.parentEmail = "Parent email is required.";
    } else if (!isValidEmail(form.parentEmail.trim())) {
      errors.parentEmail = "Please enter a valid email address.";
    }
    if (!form.parentPhone.trim()) {
      errors.parentPhone = "Phone number is required.";
    } else if (form.parentPhone.replace(/\D/g, "").length < 10) {
      errors.parentPhone = "Please enter a valid phone number.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }
    setStep(2);
  };

  const goToReviewStep = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.childName.trim()) {
      errors.childName = "Child full name is required.";
    }
    if (!form.childDob.trim()) {
      errors.childDob = "Date of birth is required.";
    } else if (!isValidDateFormat(form.childDob.trim())) {
      errors.childDob = "Use a valid date in MM/DD/YYYY format.";
    }
    if (!form.preferredStartDate.trim()) {
      errors.preferredStartDate = "Preferred start date is required.";
    } else if (!isValidDateFormat(form.preferredStartDate.trim())) {
      errors.preferredStartDate = "Use a valid date in MM/DD/YYYY format.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }
    setStep(3);
  };

  const handleProceedToCheckout = () => {
    if (selectedDaycareIds.length === 0) {
      setSubmitError("No daycare selections found. Please go back and select daycares first.");
      return;
    }

    saveAutoApplyCheckoutDraft({
      daycareIds: selectedDaycareIds,
      selectedCount,
      parentName: form.parentName.trim(),
      parentEmail: form.parentEmail.trim(),
      parentPhone: form.parentPhone.trim(),
      childName: form.childName.trim(),
      childDob: toApiDate(form.childDob.trim()),
      preferredStartDate: toApiDate(form.preferredStartDate.trim()),
      specialNotes: form.specialNotes.trim(),
    });

    setSubmitError(null);
    router.push("/payment/checkout");
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Navigation />
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {step === 1 ? "Parent Details" : step === 2 ? "Child Info" : "Review"}
            </h1>
            <div className={`rounded-xl border px-4 py-2 text-right ${badgeClasses}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">
                Auto-Apply Credits
              </p>
              <p className="text-sm font-bold sm:text-base">
                This checkout: {selectedCount}
              </p>
              <p className="text-xs sm:text-sm">
                Available now: {isLoadingCredits ? "..." : availableCredits}
              </p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-2">
            {progress.map((bar, index) => (
              <div key={index} className={`h-1.5 rounded-full ${bar}`} />
            ))}
          </div>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {step === 1 && (
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">Parent Full Name</span>
                  <input
                    value={form.parentName}
                    onChange={updateField("parentName")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="Sarah Chen"
                  />
                  {fieldErrors.parentName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.parentName}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">
                    Gmail Address (apps sent from here)
                  </span>
                  <input
                    value={form.parentEmail}
                    onChange={updateField("parentEmail")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="sarah.chen.parent@gmail.com"
                  />
                  {fieldErrors.parentEmail && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.parentEmail}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">Phone Number</span>
                  <input
                    value={form.parentPhone}
                    onChange={updateField("parentPhone")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="(416) 555-8234"
                  />
                  {fieldErrors.parentPhone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.parentPhone}</p>
                  )}
                </label>

                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-indigo-700 sm:text-base">
                  🔐 Emails originate from <strong>your Gmail inbox</strong> via OAuth2. Daycares see a
                  genuine parent inquiry.
                </div>

                <button
                  type="button"
                  onClick={goToChildStep}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-blue-600 py-3 text-lg font-bold text-white transition hover:opacity-95"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">Child&apos;s Full Name</span>
                  <input
                    value={form.childName}
                    onChange={updateField("childName")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="Emma Chen"
                  />
                  {fieldErrors.childName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.childName}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">Date of Birth</span>
                  <input
                    ref={childDobRef}
                    value={form.childDob}
                    onChange={updateField("childDob")}
                    onKeyDown={handleDateKeyDown("childDob")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="MM/DD/YYYY"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {fieldErrors.childDob && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.childDob}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">Preferred Start Date</span>
                  <input
                    ref={preferredStartDateRef}
                    value={form.preferredStartDate}
                    onChange={updateField("preferredStartDate")}
                    onKeyDown={handleDateKeyDown("preferredStartDate")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="MM/DD/YYYY"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {fieldErrors.preferredStartDate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.preferredStartDate}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-lg font-bold text-slate-900">Special Notes</span>
                  <textarea
                    value={form.specialNotes}
                    onChange={updateField("specialNotes")}
                    className="h-32 w-full resize-none rounded-2xl border border-gray-200 px-5 py-3 text-lg text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="Allergies, dietary, Montessori preference..."
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-2xl border border-gray-300 py-3 text-lg font-bold text-slate-900"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={goToReviewStep}
                    className="rounded-2xl bg-gradient-to-r from-violet-700 to-blue-600 py-3 text-lg font-bold text-white transition hover:opacity-95"
                  >
                    Review →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="rounded-3xl bg-gray-50 p-5 text-base text-slate-800 sm:text-lg">
                  <p className="mb-2">
                    Parent: <strong>{form.parentName || "—"}</strong>
                  </p>
                  <p className="mb-2">
                    Email: <strong>{form.parentEmail || "—"}</strong>
                  </p>
                  <p className="mb-2">
                    Child: <strong>{form.childName || "—"}</strong> (DOB:{" "}
                    <strong>{form.childDob || "—"}</strong>)
                  </p>
                  <p className="mb-5">
                    Start: <strong>{form.preferredStartDate || "—"}</strong>
                  </p>
                  <div className="rounded-2xl bg-indigo-100 px-4 py-3 font-bold text-indigo-700">
                    Applying to {selectedCount || 0} daycares
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 sm:text-base">
                  {isLoadingCredits ? (
                    "Loading credits..."
                  ) : (
                    <>
                      Credits remaining: <strong>{credits?.remainingCredits ?? 0}</strong> /{" "}
                      <strong>{credits?.totalCredits ?? 0}</strong>
                    </>
                  )}
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:text-base">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-2xl border border-gray-300 py-3 text-lg font-bold text-slate-900"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="rounded-2xl bg-orange-400 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-8 bg-gray-900 py-10 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-bold">KinderBridge</p>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <Link href="/search" className="hover:text-white">
                Find Daycares
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} KinderBridge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
