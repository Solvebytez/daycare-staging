"use client";

import { useState } from "react";
import type { EnrollmentPayload, EnrollmentRecord } from "@/lib/enrollmentsService";
import {
  ENROLLMENT_SECTIONS,
  mergeEnrollmentPayload,
  missingFieldLabel,
  num,
  str,
  WEEKDAYS,
  type EnrollmentSectionId,
} from "@/lib/enrollmentFormUtils";

type Props = {
  record: EnrollmentRecord;
  payload: EnrollmentPayload;
  setPayload: React.Dispatch<React.SetStateAction<EnrollmentPayload>>;
  missingFields: string[];
  saving: boolean;
  submitting: boolean;
  onSave: () => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
};

export default function EnrollmentFormWizard({
  record,
  payload,
  setPayload,
  missingFields,
  saving,
  submitting,
  onSave,
  onSubmit,
}: Props) {
  const [section, setSection] = useState<EnrollmentSectionId>("child");
  const readOnly =
    record.automationStatus === "submitted" ||
    record.automationStatus === "queued" ||
    record.automationStatus === "running";

  const patch = (partial: Partial<EnrollmentPayload>) => {
    setPayload((prev) => mergeEnrollmentPayload(prev, partial));
  };

  const child = payload.child || {};
  const pp = (payload.primary_parent || {}) as Record<string, unknown>;
  const ppAddr = (pp.address || {}) as Record<string, string>;
  const ppEmp = (pp.employment || {}) as Record<string, string>;
  const sp = (payload.secondary_parent || {}) as Record<string, unknown> | null;
  const spAddr = (sp?.address || {}) as Record<string, string>;
  const spEmp = (sp?.employment || {}) as Record<string, string>;
  const en = payload.enrollment || {};
  const days = Array.isArray(en.days_required)
    ? (en.days_required as string[])
    : [];
  const health = payload.health_and_wellness || {};
  const allergies = Array.isArray(health.food_allergies)
    ? (health.food_allergies as Record<string, string>[])
    : [];
  const dietary = Array.isArray(health.dietary_restrictions)
    ? (health.dietary_restrictions as string[])
    : [];
  const edu = payload.educational_preferences || {};
  const langInstr = Array.isArray(edu.language_of_instruction)
    ? (edu.language_of_instruction as string[])
    : [];
  const specialPrograms = Array.isArray(edu.special_programs)
    ? (edu.special_programs as string[])
    : [];
  const household = payload.household_information || {};
  const otherChildren = Array.isArray(household.other_children)
    ? (household.other_children as Record<string, string>[])
    : [];
  const contacts = Array.isArray(payload.additional_emergency_contacts)
    ? (payload.additional_emergency_contacts as Record<string, unknown>[])
    : [];
  const addl = payload.additional_information || {};
  const consents = payload.consent_and_declarations || {};
  const hasSecondary = payload.secondary_parent != null;

  const sectionIndex = ENROLLMENT_SECTIONS.findIndex((s) => s.id === section);
  const goNext = () => {
    if (sectionIndex < ENROLLMENT_SECTIONS.length - 1) {
      setSection(ENROLLMENT_SECTIONS[sectionIndex + 1].id);
    }
  };
  const goPrev = () => {
    if (sectionIndex > 0) {
      setSection(ENROLLMENT_SECTIONS[sectionIndex - 1].id);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {ENROLLMENT_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm ${
              section === s.id
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {payload.form_metadata?.form_url ? (
          <p className="mb-4 text-xs text-slate-500">
            Daycare form:{" "}
            <a
              href={payload.form_metadata.form_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              {payload.form_metadata.service_name || "Registration"}
            </a>
          </p>
        ) : null}

        {section === "child" && (
          <div className="space-y-4">
            <Field label="First name *" value={str(child.first_name)} onChange={(v) => patch({ child: { ...child, first_name: v } })} disabled={readOnly} />
            <Field label="Middle name" value={str(child.middle_name)} onChange={(v) => patch({ child: { ...child, middle_name: v } })} disabled={readOnly} />
            <Field label="Last name *" value={str(child.last_name)} onChange={(v) => patch({ child: { ...child, last_name: v } })} disabled={readOnly} />
            <Field label="Date of birth * (YYYY-MM-DD)" value={str(child.date_of_birth)} onChange={(v) => patch({ child: { ...child, date_of_birth: v } })} disabled={readOnly} />
            <Select
              label="Gender"
              value={str(child.gender)}
              onChange={(v) => patch({ child: { ...child, gender: v } })}
              disabled={readOnly}
              options={["", "Male", "Female", "Non-binary", "Prefer not to say"]}
            />
          </div>
        )}

        {section === "primary_parent" && (
          <div className="space-y-4">
            <Field label="First name *" value={str(pp.first_name)} onChange={(v) => patch({ primary_parent: { ...pp, first_name: v } })} disabled={readOnly} />
            <Field label="Last name *" value={str(pp.last_name)} onChange={(v) => patch({ primary_parent: { ...pp, last_name: v } })} disabled={readOnly} />
            <Field label="Relationship" value={str(pp.relationship)} onChange={(v) => patch({ primary_parent: { ...pp, relationship: v } })} disabled={readOnly} />
            <Field label="Email *" value={str(pp.email)} onChange={(v) => patch({ primary_parent: { ...pp, email: v } })} disabled={readOnly} />
            <Field label="Phone *" value={str(pp.phone)} onChange={(v) => patch({ primary_parent: { ...pp, phone: v } })} disabled={readOnly} />
            <p className="text-sm font-semibold text-slate-800">Address</p>
            <Field label="Street *" value={str(ppAddr.street)} onChange={(v) => patch({ primary_parent: { ...pp, address: { ...ppAddr, street: v } } })} disabled={readOnly} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City *" value={str(ppAddr.city)} onChange={(v) => patch({ primary_parent: { ...pp, address: { ...ppAddr, city: v } } })} disabled={readOnly} />
              <Field label="Province * (e.g. ON)" value={str(ppAddr.province)} onChange={(v) => patch({ primary_parent: { ...pp, address: { ...ppAddr, province: v } } })} disabled={readOnly} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Postal code *" value={str(ppAddr.postal_code)} onChange={(v) => patch({ primary_parent: { ...pp, address: { ...ppAddr, postal_code: v } } })} disabled={readOnly} />
              <Field label="Country" value={str(ppAddr.country) || "Canada"} onChange={(v) => patch({ primary_parent: { ...pp, address: { ...ppAddr, country: v } } })} disabled={readOnly} />
            </div>
            <p className="text-sm font-semibold text-slate-800">Employment (optional)</p>
            <Field label="Status" value={str(ppEmp.employment_status)} onChange={(v) => patch({ primary_parent: { ...pp, employment: { ...ppEmp, employment_status: v } } })} disabled={readOnly} />
            <Field label="Employer" value={str(ppEmp.employer_name)} onChange={(v) => patch({ primary_parent: { ...pp, employment: { ...ppEmp, employer_name: v } } })} disabled={readOnly} />
            <Field label="Job title" value={str(ppEmp.job_title)} onChange={(v) => patch({ primary_parent: { ...pp, employment: { ...ppEmp, job_title: v } } })} disabled={readOnly} />
            <Field label="Work hours" value={str(ppEmp.work_hours)} onChange={(v) => patch({ primary_parent: { ...pp, employment: { ...ppEmp, work_hours: v } } })} disabled={readOnly} />
          </div>
        )}

        {section === "secondary_parent" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={hasSecondary}
                disabled={readOnly}
                onChange={(e) => {
                  if (e.target.checked) {
                    patch({
                      secondary_parent: {
                        first_name: "",
                        last_name: "",
                        relationship: "",
                        email: "",
                        phone: "",
                        phone_type: "Mobile",
                        address: { street: "", city: "", province: "", postal_code: "", country: "Canada" },
                        employment: { employment_status: "", employer_name: "", job_title: "", work_hours: "" },
                      },
                    });
                  } else {
                    patch({ secondary_parent: null });
                  }
                }}
                className="h-4 w-4 rounded"
              />
              Include second parent / guardian
            </label>
            {hasSecondary && sp && (
              <>
                <Field label="First name" value={str(sp.first_name)} onChange={(v) => patch({ secondary_parent: { ...sp, first_name: v } })} disabled={readOnly} />
                <Field label="Last name" value={str(sp.last_name)} onChange={(v) => patch({ secondary_parent: { ...sp, last_name: v } })} disabled={readOnly} />
                <Field label="Relationship" value={str(sp.relationship)} onChange={(v) => patch({ secondary_parent: { ...sp, relationship: v } })} disabled={readOnly} />
                <Field label="Email" value={str(sp.email)} onChange={(v) => patch({ secondary_parent: { ...sp, email: v } })} disabled={readOnly} />
                <Field label="Phone" value={str(sp.phone)} onChange={(v) => patch({ secondary_parent: { ...sp, phone: v } })} disabled={readOnly} />
                <Field label="Street" value={str(spAddr.street)} onChange={(v) => patch({ secondary_parent: { ...sp, address: { ...spAddr, street: v } } })} disabled={readOnly} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" value={str(spAddr.city)} onChange={(v) => patch({ secondary_parent: { ...sp, address: { ...spAddr, city: v } } })} disabled={readOnly} />
                  <Field label="Province" value={str(spAddr.province)} onChange={(v) => patch({ secondary_parent: { ...sp, address: { ...spAddr, province: v } } })} disabled={readOnly} />
                </div>
                <Field label="Employer" value={str(spEmp.employer_name)} onChange={(v) => patch({ secondary_parent: { ...sp, employment: { ...spEmp, employer_name: v } } })} disabled={readOnly} />
              </>
            )}
          </div>
        )}

        {section === "enrollment" && (
          <div className="space-y-4">
            <Field label="Program type *" value={str(en.program_type)} onChange={(v) => patch({ enrollment: { ...en, program_type: v } })} disabled={readOnly} />
            <Field label="Start date * (YYYY-MM-DD)" value={str(en.start_date)} onChange={(v) => patch({ enrollment: { ...en, start_date: v } })} disabled={readOnly} />
            <Field label="Schedule type *" value={str(en.schedule_type)} onChange={(v) => patch({ enrollment: { ...en, schedule_type: v } })} disabled={readOnly} />
            <p className="text-sm font-medium text-slate-700">Days required</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <label key={day} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={days.includes(day)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...days, day]
                        : days.filter((d) => d !== day);
                      patch({ enrollment: { ...en, days_required: next } });
                    }}
                  />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>
        )}

        {section === "emergency" && (
          <div className="space-y-4">
            {contacts.map((c, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Contact {i + 1}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => {
                        const next = contacts.filter((_, j) => j !== i);
                        patch({ additional_emergency_contacts: next });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Field label="Name" value={str(c.name)} onChange={(v) => { const next = [...contacts]; next[i] = { ...c, name: v }; patch({ additional_emergency_contacts: next }); }} disabled={readOnly} />
                <Field label="Relationship" value={str(c.relationship)} onChange={(v) => { const next = [...contacts]; next[i] = { ...c, relationship: v }; patch({ additional_emergency_contacts: next }); }} disabled={readOnly} />
                <Field label="Phone" value={str(c.phone)} onChange={(v) => { const next = [...contacts]; next[i] = { ...c, phone: v }; patch({ additional_emergency_contacts: next }); }} disabled={readOnly} />
                <ConsentRow label="Authorized pickup" checked={c.authorized_pickup === true} disabled={readOnly} onChange={(checked) => { const next = [...contacts]; next[i] = { ...c, authorized_pickup: checked }; patch({ additional_emergency_contacts: next }); }} />
              </div>
            ))}
            {!readOnly && (
              <button
                type="button"
                className="text-sm font-semibold text-indigo-600"
                onClick={() =>
                  patch({
                    additional_emergency_contacts: [
                      ...contacts,
                      { name: "", relationship: "", phone: "", authorized_pickup: false },
                    ],
                  })
                }
              >
                + Add contact
              </button>
            )}
          </div>
        )}

        {section === "health" && (
          <div className="space-y-4">
            <Field
              label="Dietary restrictions (comma-separated)"
              value={dietary.join(", ")}
              onChange={(v) =>
                patch({
                  health_and_wellness: {
                    ...health,
                    dietary_restrictions: v.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              disabled={readOnly}
            />
            {allergies.map((a, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Allergy {i + 1}</span>
                  {!readOnly && (
                    <button type="button" className="text-xs text-red-600" onClick={() => patch({ health_and_wellness: { ...health, food_allergies: allergies.filter((_, j) => j !== i) } })}>
                      Remove
                    </button>
                  )}
                </div>
                <Field label="Allergen" value={str(a.allergen)} onChange={(v) => { const n = [...allergies]; n[i] = { ...a, allergen: v }; patch({ health_and_wellness: { ...health, food_allergies: n } }); }} disabled={readOnly} />
                <Field label="Severity" value={str(a.severity)} onChange={(v) => { const n = [...allergies]; n[i] = { ...a, severity: v }; patch({ health_and_wellness: { ...health, food_allergies: n } }); }} disabled={readOnly} />
                <Field label="Reaction" value={str(a.reaction)} onChange={(v) => { const n = [...allergies]; n[i] = { ...a, reaction: v }; patch({ health_and_wellness: { ...health, food_allergies: n } }); }} disabled={readOnly} />
              </div>
            ))}
            {!readOnly && (
              <button type="button" className="text-sm font-semibold text-indigo-600" onClick={() => patch({ health_and_wellness: { ...health, food_allergies: [...allergies, { allergen: "", severity: "", reaction: "" }] } })}>
                + Add allergy
              </button>
            )}
            <ConsentRow label="Photo consent" checked={health.photo_consent === true} disabled={readOnly} onChange={(c) => patch({ health_and_wellness: { ...health, photo_consent: c } })} />
            <ConsentRow label="Emergency medical treatment" checked={health.emergency_medical_treatment === true} disabled={readOnly} onChange={(c) => patch({ health_and_wellness: { ...health, emergency_medical_treatment: c } })} />
          </div>
        )}

        {section === "education" && (
          <div className="space-y-4">
            <Field label="Curriculum type" value={str(edu.curriculum_type)} onChange={(v) => patch({ educational_preferences: { ...edu, curriculum_type: v } })} disabled={readOnly} />
            <Field label="Languages (comma-separated)" value={langInstr.join(", ")} onChange={(v) => patch({ educational_preferences: { ...edu, language_of_instruction: v.split(",").map((s) => s.trim()).filter(Boolean) } })} disabled={readOnly} />
            <Field label="Special programs (comma-separated)" value={specialPrograms.join(", ")} onChange={(v) => patch({ educational_preferences: { ...edu, special_programs: v.split(",").map((s) => s.trim()).filter(Boolean) } })} disabled={readOnly} />
            <ConsentRow label="Parent participation" checked={edu.parent_participation === true} disabled={readOnly} onChange={(c) => patch({ educational_preferences: { ...edu, parent_participation: c } })} />
          </div>
        )}

        {section === "household" && (
          <div className="space-y-4">
            <Field label="Household size" value={num(household.household_size) === "" ? "" : String(num(household.household_size))} onChange={(v) => patch({ household_information: { ...household, household_size: v ? Number(v) : null } })} disabled={readOnly} />
            <Field label="Family structure" value={str(household.family_structure)} onChange={(v) => patch({ household_information: { ...household, family_structure: v } })} disabled={readOnly} />
            {otherChildren.map((oc, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Other child {i + 1}</span>
                  {!readOnly && (
                    <button type="button" className="text-xs text-red-600" onClick={() => patch({ household_information: { ...household, other_children: otherChildren.filter((_, j) => j !== i) } })}>
                      Remove
                    </button>
                  )}
                </div>
                <Field label="Name" value={str(oc.name)} onChange={(v) => { const n = [...otherChildren]; n[i] = { ...oc, name: v }; patch({ household_information: { ...household, other_children: n } }); }} disabled={readOnly} />
                <Field label="Date of birth" value={str(oc.date_of_birth)} onChange={(v) => { const n = [...otherChildren]; n[i] = { ...oc, date_of_birth: v }; patch({ household_information: { ...household, other_children: n } }); }} disabled={readOnly} />
              </div>
            ))}
            {!readOnly && (
              <button type="button" className="text-sm font-semibold text-indigo-600" onClick={() => patch({ household_information: { ...household, other_children: [...otherChildren, { name: "", date_of_birth: "" }] } })}>
                + Add sibling
              </button>
            )}
          </div>
        )}

        {section === "additional" && (
          <div className="space-y-4">
            <Field label="How did you hear about us?" value={str(addl.how_heard_about_us)} onChange={(v) => patch({ additional_information: { ...addl, how_heard_about_us: v } })} disabled={readOnly} />
            <Field label="Referral name" value={str(addl.referral_name)} onChange={(v) => patch({ additional_information: { ...addl, referral_name: v } })} disabled={readOnly} />
            <TextArea label="Additional notes" value={str(addl.additional_notes)} onChange={(v) => patch({ additional_information: { ...addl, additional_notes: v } })} disabled={readOnly} />
            <Select
              label="Preferred language"
              value={str(payload.form_metadata?.preferred_language) || "English"}
              onChange={(v) =>
                patch({
                  form_metadata: {
                    ...payload.form_metadata,
                    preferred_language: v,
                  },
                })
              }
              disabled={readOnly}
              options={["English", "French", "Mandarin", "Other"]}
            />
          </div>
        )}

        {section === "consents" && (
          <div className="space-y-3">
            <ConsentRow label="Parent declaration *" checked={consents.parent_declaration === true} disabled={readOnly} onChange={(c) => patch({ consent_and_declarations: { ...consents, parent_declaration: c } })} />
            <ConsentRow label="Privacy policy *" checked={consents.privacy_policy === true} disabled={readOnly} onChange={(c) => patch({ consent_and_declarations: { ...consents, privacy_policy: c } })} />
            <ConsentRow label="Photo release" checked={consents.photo_release === true} disabled={readOnly} onChange={(c) => patch({ consent_and_declarations: { ...consents, photo_release: c } })} />
            <ConsentRow label="Terms and conditions *" checked={consents.terms_and_conditions === true} disabled={readOnly} onChange={(c) => patch({ consent_and_declarations: { ...consents, terms_and_conditions: c } })} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <div className="flex gap-2">
            <button type="button" onClick={goPrev} disabled={sectionIndex === 0} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40">
              Previous
            </button>
            <button type="button" onClick={goNext} disabled={sectionIndex >= ENROLLMENT_SECTIONS.length - 1} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40">
              Next
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSave} disabled={saving || readOnly} className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || saving || readOnly}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit to daycare"}
            </button>
          </div>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Required before submit:</p>
          <ul className="mt-1 list-inside list-disc">
            {missingFields.map((f) => (
              <li key={f}>{missingFieldLabel(f)}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        disabled={disabled}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
      >
        {options.map((o) => (
          <option key={o || "empty"} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConsentRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
      {label}
    </label>
  );
}
