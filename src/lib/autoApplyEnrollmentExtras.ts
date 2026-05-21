import type { EnrollmentPayload } from "./enrollmentsService";
import { splitFullName } from "./enrollmentFormUtils";

/** Optional fields collected in 3-step form (not required to continue). */
export type AutoApplyOptionalExtras = {
  parentRelationship: string;
  phoneType: string;
  addressStreet: string;
  addressCity: string;
  addressProvince: string;
  addressPostal: string;
  addressCountry: string;
  employmentStatus: string;
  employerName: string;
  jobTitle: string;
  workHours: string;
  includeSecondaryParent: boolean;
  secondaryFirstName: string;
  secondaryLastName: string;
  secondaryRelationship: string;
  secondaryEmail: string;
  secondaryPhone: string;
  preferredLanguage: string;

  childMiddleName: string;
  childGender: string;
  programType: string;
  scheduleType: string;
  daysRequired: string[];
  dietaryRestrictions: string;
  curriculumType: string;
  languageOfInstruction: string;
  specialPrograms: string;
  householdSize: string;
  familyStructure: string;
  howHeardAboutUs: string;
  referralName: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyAuthorizedPickup: boolean;
  photoConsent: boolean;
  emergencyMedicalTreatment: boolean;
  parentParticipation: boolean;
  photoRelease: boolean;
  parentDeclaration: boolean;
  privacyPolicy: boolean;
  termsAndConditions: boolean;
};

export const EMPTY_OPTIONAL_EXTRAS: AutoApplyOptionalExtras = {
  parentRelationship: "",
  phoneType: "",
  addressStreet: "",
  addressCity: "",
  addressProvince: "",
  addressPostal: "",
  addressCountry: "",
  employmentStatus: "",
  employerName: "",
  jobTitle: "",
  workHours: "",
  includeSecondaryParent: false,
  secondaryFirstName: "",
  secondaryLastName: "",
  secondaryRelationship: "",
  secondaryEmail: "",
  secondaryPhone: "",
  preferredLanguage: "",
  childMiddleName: "",
  childGender: "",
  programType: "",
  scheduleType: "",
  daysRequired: [],
  dietaryRestrictions: "",
  curriculumType: "",
  languageOfInstruction: "",
  specialPrograms: "",
  householdSize: "",
  familyStructure: "",
  howHeardAboutUs: "",
  referralName: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  emergencyAuthorizedPickup: false,
  photoConsent: false,
  emergencyMedicalTreatment: false,
  parentParticipation: false,
  photoRelease: false,
  parentDeclaration: false,
  privacyPolicy: false,
  termsAndConditions: false,
};

type CoreApplyFields = {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childDob: string;
  preferredStartDate: string;
  specialNotes: string;
};

export function buildEnrollmentPayloadFromAutoApply(
  core: CoreApplyFields,
  extras: AutoApplyOptionalExtras
): Partial<EnrollmentPayload> {
  const parentNames = splitFullName(core.parentName);
  const childNames = splitFullName(core.childName);

  const payload: Partial<EnrollmentPayload> = {
    child: {
      first_name: childNames.first_name,
      middle_name: extras.childMiddleName.trim() || childNames.middle_name,
      last_name: childNames.last_name,
      date_of_birth: core.childDob,
      gender: extras.childGender.trim(),
    },
    primary_parent: {
      first_name: parentNames.first_name,
      last_name: parentNames.last_name || parentNames.middle_name,
      relationship: extras.parentRelationship.trim(),
      email: core.parentEmail.trim().toLowerCase(),
      phone: core.parentPhone.trim(),
      phone_type: extras.phoneType.trim(),
      address: {
        street: extras.addressStreet.trim(),
        city: extras.addressCity.trim(),
        province: extras.addressProvince.trim(),
        postal_code: extras.addressPostal.trim(),
        country: extras.addressCountry.trim(),
      },
      employment: {
        employment_status: extras.employmentStatus.trim(),
        employer_name: extras.employerName.trim(),
        job_title: extras.jobTitle.trim(),
        work_hours: extras.workHours.trim(),
      },
    },
    enrollment: {
      program_type: extras.programType.trim(),
      start_date: core.preferredStartDate,
      schedule_type: extras.scheduleType.trim(),
      days_required: extras.daysRequired,
    },
    additional_information: {
      how_heard_about_us: extras.howHeardAboutUs.trim(),
      referral_name: extras.referralName.trim(),
      additional_notes: core.specialNotes.trim(),
    },
    health_and_wellness: {
      dietary_restrictions: extras.dietaryRestrictions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      food_allergies: [],
      photo_consent: extras.photoConsent,
      emergency_medical_treatment: extras.emergencyMedicalTreatment,
    },
    educational_preferences: {
      curriculum_type: extras.curriculumType.trim(),
      language_of_instruction: extras.languageOfInstruction
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      special_programs: extras.specialPrograms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      parent_participation: extras.parentParticipation,
    },
    household_information: {
      household_size: extras.householdSize.trim()
        ? Number(extras.householdSize)
        : null,
      other_children: [],
      family_structure: extras.familyStructure.trim(),
    },
    consent_and_declarations: {
      parent_declaration: extras.parentDeclaration,
      privacy_policy: extras.privacyPolicy,
      photo_release: extras.photoRelease,
      terms_and_conditions: extras.termsAndConditions,
    },
    form_metadata: {
      preferred_language: extras.preferredLanguage.trim(),
    },
  };

  if (extras.includeSecondaryParent) {
    payload.secondary_parent = {
      first_name: extras.secondaryFirstName.trim(),
      last_name: extras.secondaryLastName.trim(),
      relationship: extras.secondaryRelationship.trim(),
      email: extras.secondaryEmail.trim(),
      phone: extras.secondaryPhone.trim(),
      phone_type: extras.phoneType.trim(),
      address: {
        street: extras.addressStreet.trim(),
        city: extras.addressCity.trim(),
        province: extras.addressProvince.trim(),
        postal_code: extras.addressPostal.trim(),
        country: extras.addressCountry.trim(),
      },
      employment: {
        employment_status: "",
        employer_name: "",
        job_title: "",
        work_hours: "",
      },
    };
  }

  if (
    extras.emergencyName.trim() ||
    extras.emergencyPhone.trim()
  ) {
    payload.additional_emergency_contacts = [
      {
        name: extras.emergencyName.trim(),
        relationship: extras.emergencyRelationship.trim(),
        phone: extras.emergencyPhone.trim(),
        authorized_pickup: extras.emergencyAuthorizedPickup,
      },
    ];
  }

  return payload;
}

export type AutoApplyReviewItem = { label: string; value: string };
export type AutoApplyReviewSection = { title: string; items: AutoApplyReviewItem[] };

function reviewText(value: string | undefined | null): string | null {
  const s = (value ?? "").trim();
  return s || null;
}

function reviewOptionalText(
  value: string,
  defaultValue?: string
): string | null {
  const s = value.trim();
  if (!s) return null;
  if (defaultValue !== undefined && s === defaultValue) return null;
  return s;
}

function reviewYes(checked: boolean, label: string): AutoApplyReviewItem | null {
  return checked ? { label, value: "Yes" } : null;
}

function reviewSection(
  title: string,
  items: (AutoApplyReviewItem | null)[]
): AutoApplyReviewSection | null {
  const filtered = items.filter((i): i is AutoApplyReviewItem => i !== null);
  return filtered.length ? { title, items: filtered } : null;
}

/** Grouped labels + values for step 3 review (required always; optional when filled). */
export function buildAutoApplyReviewSections(
  core: CoreApplyFields,
  extras: AutoApplyOptionalExtras
): AutoApplyReviewSection[] {
  const opt = (
    label: string,
    value: string,
    defaultValue?: string
  ): AutoApplyReviewItem | null => {
    const v = reviewOptionalText(value, defaultValue);
    return v ? { label, value: v } : null;
  };

  const out: AutoApplyReviewSection[] = [];

  out.push({
    title: "Parent",
    items: [
      { label: "Full name", value: core.parentName.trim() || "—" },
      { label: "Email", value: core.parentEmail.trim() || "—" },
      { label: "Phone", value: core.parentPhone.trim() || "—" },
    ],
  });

  const parentExtra = reviewSection("More parent details", [
    opt("Relationship", extras.parentRelationship),
    opt("Phone type", extras.phoneType, EMPTY_OPTIONAL_EXTRAS.phoneType),
    opt("Street address", extras.addressStreet),
    opt("City", extras.addressCity),
    opt("Province", extras.addressProvince),
    opt("Postal code", extras.addressPostal),
    opt("Country", extras.addressCountry, EMPTY_OPTIONAL_EXTRAS.addressCountry),
    opt("Employment status", extras.employmentStatus),
    opt("Employer", extras.employerName),
    opt("Job title", extras.jobTitle),
    opt("Work hours", extras.workHours),
    opt("Preferred language", extras.preferredLanguage, EMPTY_OPTIONAL_EXTRAS.preferredLanguage),
  ]);
  if (parentExtra) out.push(parentExtra);

  if (extras.includeSecondaryParent) {
    const second = reviewSection("Second parent / guardian", [
      { label: "Included", value: "Yes" },
      opt("First name", extras.secondaryFirstName),
      opt("Last name", extras.secondaryLastName),
      opt("Relationship", extras.secondaryRelationship),
      opt("Email", extras.secondaryEmail),
      opt("Phone", extras.secondaryPhone),
    ]);
    if (second) out.push(second);
  }

  const childItems: AutoApplyReviewItem[] = [
    { label: "Full name", value: core.childName.trim() || "—" },
    { label: "Date of birth", value: core.childDob.trim() || "—" },
    { label: "Preferred start date", value: core.preferredStartDate.trim() || "—" },
  ];
  const notes = reviewText(core.specialNotes);
  if (notes) childItems.push({ label: "Special notes", value: notes });
  out.push({ title: "Child", items: childItems });

  const childExtra = reviewSection("More child & enrollment details", [
    opt("Middle name", extras.childMiddleName),
    opt("Gender", extras.childGender),
    opt("Program type", extras.programType),
    opt("Schedule type", extras.scheduleType),
    extras.daysRequired.length
      ? { label: "Days needed", value: extras.daysRequired.join(", ") }
      : null,
    opt("Dietary restrictions", extras.dietaryRestrictions),
    opt("Curriculum preference", extras.curriculumType),
    opt("Languages", extras.languageOfInstruction),
    opt("Special programs", extras.specialPrograms),
    opt("Household size", extras.householdSize),
    opt("Family structure", extras.familyStructure),
    opt("How did you hear about us?", extras.howHeardAboutUs),
    opt("Referral name", extras.referralName),
  ]);
  if (childExtra) out.push(childExtra);

  const emergency = reviewSection("Emergency contact", [
    opt("Name", extras.emergencyName),
    opt("Relationship", extras.emergencyRelationship),
    opt("Phone", extras.emergencyPhone),
    reviewYes(extras.emergencyAuthorizedPickup, "Authorized for pickup"),
  ]);
  if (emergency) out.push(emergency);

  const consents = reviewSection("Preferences & consents", [
    reviewYes(extras.photoConsent, "Photo consent (health)"),
    reviewYes(extras.emergencyMedicalTreatment, "Emergency medical treatment"),
    reviewYes(extras.parentParticipation, "Parent participation in programs"),
    reviewYes(extras.photoRelease, "Photo release"),
    reviewYes(extras.parentDeclaration, "Parent declaration"),
    reviewYes(extras.privacyPolicy, "Privacy policy"),
    reviewYes(extras.termsAndConditions, "Terms and conditions"),
  ]);
  if (consents) out.push(consents);

  return out;
}
