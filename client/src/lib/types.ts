import type { CONDITIONS, GENDERS, SPECIALIZATIONS } from "./constants";

export type Specialization = (typeof SPECIALIZATIONS)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Gender = (typeof GENDERS)[number];

export type User = { id: string; name: string; email: string; role: "admin" | "viewer" };

export type AdminUser = { id: string; name: string; email: string; createdAt: string; lastLoginAt: string | null };
export type AdminInput = { name: string; email: string; password: string };

export type Paged<T> = { items: T[]; page: number; limit: number; total: number; pages: number };

export type DoctorRef = { _id: string; name: string; specialization: Specialization; hospital: string };

export type Doctor = {
  _id: string;
  name: string;
  specialization: Specialization;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type DoctorRow = Doctor & { patients: { total: number; critical: number } };
export type DoctorDetail = Doctor & {
  patients: { total: number; inCare: number; byCondition: Partial<Record<Condition, number>> };
  trend: { date: string; admissions: number }[];
};

export type Patient = {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: Condition;
  diagnosis: string;
  notes?: string;
  doctor: DoctorRef;
  admittedAt: string;
  /** Null while in care. */
  releasedAt: string | null;
  createdAt: string;
};

export type DoctorInput = Pick<Doctor, "name" | "specialization" | "hospital" | "phone" | "email">;
export type PatientInput = {
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: Condition;
  diagnosis: string;
  notes?: string;
  admittedAt?: string;
  doctor?: string;
};

export type Range = "7d" | "30d" | "90d" | "12m";

export type Overview = {
  range: { key: Range | "custom"; from: string; to: string; unit: "day" | "week" | "month" };
  totals: {
    doctors: number;
    patients: number;
    critical: number;
    avgPerDoctor: number;
    admissions: number;
    admissionsPrev: number;
    inCare: number;
    released: number;
    avgStayDays: number | null;
  };
  conditions: { condition: Condition; count: number }[];
  series: { date: string; admissions: number; released: number; critical: number }[];
  topDoctors: { id: string; name: string; specialization: Specialization; patients: number; critical: number }[];
  specialties: { specialization: Specialization; patients: number }[];
  recent: (Pick<Patient, "_id" | "name" | "condition" | "diagnosis" | "admittedAt"> & { doctor: { _id: string; name: string } })[];
};
