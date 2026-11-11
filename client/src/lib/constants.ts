export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "ENT",
  "Gastroenterology",
  "General Medicine",
  "Gynecology",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Urology",
] as const;

export const CONDITIONS = ["critical", "serious", "stable", "recovering", "released"] as const;
/** What can be picked in the form. Released is set only by the Release action. */
export const CARE_CONDITIONS = ["critical", "serious", "stable", "recovering"] as const;
export const GENDERS = ["female", "male", "other"] as const;

export const CONDITION_META: Record<(typeof CONDITIONS)[number], { label: string; color: string; hint: string }> = {
  critical: { label: "Critical", color: "var(--c-critical)", hint: "Needs immediate attention" },
  serious: { label: "Serious", color: "var(--c-serious)", hint: "Unstable, monitored closely" },
  stable: { label: "Stable", color: "var(--c-stable)", hint: "Vital signs within range" },
  recovering: { label: "Recovering", color: "var(--c-recovering)", hint: "Improving under treatment" },
  released: { label: "Released", color: "var(--c-released)", hint: "Left care" },
};

export const GENDER_LABEL: Record<(typeof GENDERS)[number], string> = { female: "Female", male: "Male", other: "Other" };

export const PAGE_SIZES = [10, 20, 50] as const;
