"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { readSearchSelection } from "../lib/autoApplyPending";
import { saveAutoApplyCheckoutDraft } from "../lib/autoApplyCheckout";
import {
  buildAutoApplyReviewSections,
  buildEnrollmentPayloadFromAutoApply,
  EMPTY_OPTIONAL_EXTRAS,
  type AutoApplyOptionalExtras,
} from "../lib/autoApplyEnrollmentExtras";
import { WEEKDAYS } from "../lib/enrollmentFormUtils";
import Navigation from "./Navigation";
import {
  FormCard,
  FormField,
  InfoBanner,
  OptionalBlock,
  OptCheck,
  OptInput,
  OptSelect,
  DayChip,
  SubSectionTitle,
  StepProgress,
  PrimaryButton,
  OutlineButton,
  AutoApplyReviewSummary,
  inputRequiredClass,
  textareaClass,
} from "./autoApply/AutoApplyFormUI";
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

function AutoApplyThreeStepFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [extras, setExtras] = useState<AutoApplyOptionalExtras>(EMPTY_OPTIONAL_EXTRAS);
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

  const reviewSections = useMemo(
    () => buildAutoApplyReviewSections(form, extras),
    [form, extras]
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

  const updateExtra =
    (key: keyof AutoApplyOptionalExtras) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const raw = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setExtras((prev) => ({ ...prev, [key]: raw }));
    };

  const toggleDay = (day: string) => {
    setExtras((prev) => {
      const has = prev.daysRequired.includes(day);
      return {
        ...prev,
        daysRequired: has
          ? prev.daysRequired.filter((d) => d !== day)
          : [...prev.daysRequired, day],
      };
    });
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

    const core = {
      parentName: form.parentName.trim(),
      parentEmail: form.parentEmail.trim(),
      parentPhone: form.parentPhone.trim(),
      childName: form.childName.trim(),
      childDob: toApiDate(form.childDob.trim()),
      preferredStartDate: toApiDate(form.preferredStartDate.trim()),
      specialNotes: form.specialNotes.trim(),
    };
    const enrollmentPayload = buildEnrollmentPayloadFromAutoApply(core, extras);
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.info("[auto-apply] checkout draft enrollmentPayload", enrollmentPayload);
    }

    saveAutoApplyCheckoutDraft({
      daycareIds: selectedDaycareIds,
      selectedCount,
      ...core,
      optionalExtras: extras,
      enrollmentPayload,
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
            <div
              className={`rounded-2xl border px-5 py-3 text-right shadow-sm ${badgeClasses}`}
            >
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

          <StepProgress step={step} />

          <FormCard>
            {step === 1 && (
              <div className="space-y-6">
                <FormField label="Parent Full Name" required error={fieldErrors.parentName}>
                  <input
                    value={form.parentName}
                    onChange={updateField("parentName")}
                    className={inputRequiredClass}
                    placeholder="Sarah Chen"
                  />
                </FormField>

                <FormField
                  label="Gmail Address (apps sent from here)"
                  required
                  error={fieldErrors.parentEmail}
                  hint="Applications are sent from this inbox via OAuth2."
                >
                  <input
                    value={form.parentEmail}
                    onChange={updateField("parentEmail")}
                    className={inputRequiredClass}
                    placeholder="sarah.chen.parent@gmail.com"
                    type="email"
                    autoComplete="email"
                  />
                </FormField>

                <FormField label="Phone Number" required error={fieldErrors.parentPhone}>
                  <input
                    value={form.parentPhone}
                    onChange={updateField("parentPhone")}
                    className={inputRequiredClass}
                    placeholder="(416) 555-8234"
                    type="tel"
                    autoComplete="tel"
                  />
                </FormField>

                <InfoBanner>
                  🔐 Emails originate from <strong>your Gmail inbox</strong> via OAuth2. Daycares see a
                  genuine parent inquiry.
                </InfoBanner>

                <OptionalBlock title="More parent details (optional)">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="Relationship" value={extras.parentRelationship} onChange={updateExtra("parentRelationship")} />
                    <OptInput label="Phone type" value={extras.phoneType} onChange={updateExtra("phoneType")} />
                  </div>
                  <OptInput label="Street address" value={extras.addressStreet} onChange={updateExtra("addressStreet")} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="City" value={extras.addressCity} onChange={updateExtra("addressCity")} />
                    <OptInput label="Province (e.g. ON)" value={extras.addressProvince} onChange={updateExtra("addressProvince")} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="Postal code" value={extras.addressPostal} onChange={updateExtra("addressPostal")} />
                    <OptInput label="Country" value={extras.addressCountry} onChange={updateExtra("addressCountry")} />
                  </div>
                  <SubSectionTitle>Employment</SubSectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="Status" value={extras.employmentStatus} onChange={updateExtra("employmentStatus")} />
                    <OptInput label="Employer" value={extras.employerName} onChange={updateExtra("employerName")} />
                    <OptInput label="Job title" value={extras.jobTitle} onChange={updateExtra("jobTitle")} />
                    <OptInput label="Work hours" value={extras.workHours} onChange={updateExtra("workHours")} />
                  </div>
                  <OptCheck
                    label="Add second parent / guardian"
                    checked={extras.includeSecondaryParent}
                    onChange={updateExtra("includeSecondaryParent")}
                  />
                  {extras.includeSecondaryParent && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <OptInput label="First name" value={extras.secondaryFirstName} onChange={updateExtra("secondaryFirstName")} />
                      <OptInput label="Last name" value={extras.secondaryLastName} onChange={updateExtra("secondaryLastName")} />
                      <OptInput label="Relationship" value={extras.secondaryRelationship} onChange={updateExtra("secondaryRelationship")} />
                      <OptInput label="Email" value={extras.secondaryEmail} onChange={updateExtra("secondaryEmail")} />
                      <OptInput label="Phone" value={extras.secondaryPhone} onChange={updateExtra("secondaryPhone")} />
                    </div>
                  )}
                  <OptSelect
                    label="Preferred language"
                    value={extras.preferredLanguage}
                    onChange={updateExtra("preferredLanguage")}
                    options={["English", "French", "Mandarin", "Other"]}
                  />
                </OptionalBlock>

                <PrimaryButton onClick={goToChildStep}>Continue →</PrimaryButton>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <FormField label="Child's Full Name" required error={fieldErrors.childName}>
                  <input
                    value={form.childName}
                    onChange={updateField("childName")}
                    className={inputRequiredClass}
                    placeholder="Emma Chen"
                  />
                </FormField>

                <FormField label="Date of Birth" required error={fieldErrors.childDob} hint="Format: MM/DD/YYYY">
                  <input
                    ref={childDobRef}
                    value={form.childDob}
                    onChange={updateField("childDob")}
                    onKeyDown={handleDateKeyDown("childDob")}
                    className={inputRequiredClass}
                    placeholder="MM/DD/YYYY"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </FormField>

                <FormField
                  label="Preferred Start Date"
                  required
                  error={fieldErrors.preferredStartDate}
                  hint="Format: MM/DD/YYYY"
                >
                  <input
                    ref={preferredStartDateRef}
                    value={form.preferredStartDate}
                    onChange={updateField("preferredStartDate")}
                    onKeyDown={handleDateKeyDown("preferredStartDate")}
                    className={inputRequiredClass}
                    placeholder="MM/DD/YYYY"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </FormField>

                <FormField label="Special Notes">
                  <textarea
                    value={form.specialNotes}
                    onChange={updateField("specialNotes")}
                    className={textareaClass}
                    placeholder="Allergies, dietary, Montessori preference..."
                  />
                </FormField>

                <OptionalBlock title="More child & enrollment details (optional)">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="Middle name" value={extras.childMiddleName} onChange={updateExtra("childMiddleName")} />
                    <OptSelect
                      label="Gender"
                      value={extras.childGender}
                      onChange={updateExtra("childGender")}
                      options={["", "Male", "Female", "Non-binary", "Prefer not to say"]}
                    />
                    <OptInput label="Program type" value={extras.programType} onChange={updateExtra("programType")} placeholder="Preschool (2-5 years)" />
                    <OptInput label="Schedule type" value={extras.scheduleType} onChange={updateExtra("scheduleType")} placeholder="Full Time (5 days)" />
                  </div>
                  <SubSectionTitle>Days needed</SubSectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <DayChip
                        key={day}
                        day={day}
                        checked={extras.daysRequired.includes(day)}
                        onToggle={() => toggleDay(day)}
                      />
                    ))}
                  </div>
                  <OptInput label="Dietary restrictions (comma-separated)" value={extras.dietaryRestrictions} onChange={updateExtra("dietaryRestrictions")} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="Curriculum preference" value={extras.curriculumType} onChange={updateExtra("curriculumType")} />
                    <OptInput label="Languages (comma-separated)" value={extras.languageOfInstruction} onChange={updateExtra("languageOfInstruction")} />
                    <OptInput label="Special programs (comma-separated)" value={extras.specialPrograms} onChange={updateExtra("specialPrograms")} />
                    <OptInput label="Household size" value={extras.householdSize} onChange={updateExtra("householdSize")} />
                    <OptInput label="Family structure" value={extras.familyStructure} onChange={updateExtra("familyStructure")} />
                    <OptInput label="How did you hear about us?" value={extras.howHeardAboutUs} onChange={updateExtra("howHeardAboutUs")} />
                    <OptInput label="Referral name" value={extras.referralName} onChange={updateExtra("referralName")} />
                  </div>
                  <SubSectionTitle>Emergency contact</SubSectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptInput label="Name" value={extras.emergencyName} onChange={updateExtra("emergencyName")} />
                    <OptInput label="Relationship" value={extras.emergencyRelationship} onChange={updateExtra("emergencyRelationship")} />
                    <OptInput label="Phone" value={extras.emergencyPhone} onChange={updateExtra("emergencyPhone")} />
                  </div>
                  <OptCheck
                    label="Authorized for pickup"
                    checked={extras.emergencyAuthorizedPickup}
                    onChange={updateExtra("emergencyAuthorizedPickup")}
                  />
                  <SubSectionTitle>Preferences & consents</SubSectionTitle>
                  <div className="space-y-2">
                    <OptCheck label="Photo consent (health)" checked={extras.photoConsent} onChange={updateExtra("photoConsent")} />
                    <OptCheck label="Emergency medical treatment" checked={extras.emergencyMedicalTreatment} onChange={updateExtra("emergencyMedicalTreatment")} />
                    <OptCheck label="Parent participation in programs" checked={extras.parentParticipation} onChange={updateExtra("parentParticipation")} />
                    <OptCheck label="Photo release" checked={extras.photoRelease} onChange={updateExtra("photoRelease")} />
                    <OptCheck label="Parent declaration" checked={extras.parentDeclaration} onChange={updateExtra("parentDeclaration")} />
                    <OptCheck label="Privacy policy" checked={extras.privacyPolicy} onChange={updateExtra("privacyPolicy")} />
                    <OptCheck label="Terms and conditions" checked={extras.termsAndConditions} onChange={updateExtra("termsAndConditions")} />
                  </div>
                </OptionalBlock>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <OutlineButton onClick={() => setStep(1)}>← Back</OutlineButton>
                  <PrimaryButton onClick={goToReviewStep}>Review →</PrimaryButton>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <AutoApplyReviewSummary
                  sections={reviewSections}
                  selectedCount={selectedCount}
                />

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-5 py-4 text-sm text-indigo-800 sm:text-base">
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

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <OutlineButton onClick={() => setStep(2)}>← Back</OutlineButton>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 py-3.5 text-lg font-bold text-white shadow-lg shadow-orange-400/30 transition hover:from-orange-500 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </div>
            )}
          </FormCard>
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

export default function AutoApplyThreeStepForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
              <p className="text-sm text-gray-600">Loading…</p>
            </div>
          </div>
        </div>
      }
    >
      <AutoApplyThreeStepFormInner />
    </Suspense>
  );
}
