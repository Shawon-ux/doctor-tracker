import { z } from "zod";
import { toDateInput } from "./format";
import { CARE_CONDITIONS, GENDERS, SPECIALIZATIONS } from "./constants";

// Mirrors the API rules so most mistakes are caught before a round trip. The API stays authoritative.
const phone = z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number");
const name = z.string().trim().min(2, "At least 2 characters").max(80, "Keep it under 80 characters");

export const doctorSchema = z.object({
  name,
  specialization: z.enum(SPECIALIZATIONS, "Choose a specialty"),
  hospital: z.string().trim().min(2, "At least 2 characters").max(120),
  phone,
  email: z.email("Enter a valid email"),
});

export const patientSchema = z.object({
  name,
  age: z
    .string()
    .trim()
    .min(1, "Enter an age")
    .pipe(z.coerce.number<string>("Enter a number").int("Whole years only").min(0, "0 or more").max(120, "120 or less")),
  gender: z.enum(GENDERS, "Choose one"),
  phone,
  email: z.union([z.email("Enter a valid email"), z.literal("")]).optional(),
  condition: z.enum(CARE_CONDITIONS, "Choose a condition"),
  diagnosis: z.string().trim().min(2, "At least 2 characters").max(160),
  notes: z.string().trim().max(1000).optional(),
  admittedAt: z
    .string()
    .min(1, "Enter a date as DD-MM-YYYY")
    .refine((v) => v <= toDateInput(new Date()), "Admission date cannot be in the future"),
  doctor: z.string().min(1, "Choose a doctor").optional(),
});

export const adminSchema = z.object({
  name,
  email: z.email("Enter a valid email"),
  password: z.string().min(10, "At least 10 characters").max(200),
});
