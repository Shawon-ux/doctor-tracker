export const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'ENT',
  'Gastroenterology',
  'General Medicine',
  'Gynecology',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Urology',
] as const;

/** Clinical severity, ordered most to least urgent. */
export const CONDITIONS = ['critical', 'serious', 'stable', 'recovering', 'released'] as const;
/** Conditions a patient in care can have. `released` is set only by the release action. */
export const CARE_CONDITIONS = ['critical', 'serious', 'stable', 'recovering'] as const;
export const GENDERS = ['female', 'male', 'other'] as const;

export type Condition = (typeof CONDITIONS)[number];
export type CareCondition = (typeof CARE_CONDITIONS)[number];
