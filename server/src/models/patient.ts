import { Schema, model, type InferSchemaType } from 'mongoose';
import { CONDITIONS, GENDERS } from './constants.js';
import { toKeywords } from '../lib/search.js';

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, required: true, enum: GENDERS },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    condition: { type: String, required: true, enum: CONDITIONS },
    diagnosis: { type: String, required: true, trim: true, maxlength: 160 },
    notes: { type: String, trim: true, maxlength: 1000 },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    admittedAt: { type: Date, required: true, default: () => new Date() },
    // Empty while the patient is in care.
    releasedAt: {
      type: Date,
      default: null,
      validate: {
        validator(this: { admittedAt: Date }, v: Date | null) {
          return !v || v.getTime() >= this.admittedAt.getTime();
        },
        message: 'Release cannot be before admission',
      },
    },
    keywords: { type: [String], select: false },
  },
  { timestamps: true },
);

patientSchema.pre('save', function () {
  this.keywords = toKeywords(this.name, this.diagnosis, this.phone.replace(/\D/g, ''));
});

// Leading key per access path: doctor page, condition filter, date sort, search.
// Trailing _id matches the API's tiebreaker sort, so the index returns rows already ordered.
patientSchema.index({ doctor: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ condition: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ admittedAt: -1, _id: -1 });
// In-care and released lists, and the dashboard's in-care counts (releasedAt: null).
patientSchema.index({ releasedAt: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ keywords: 1 });

export type PatientDoc = InferSchemaType<typeof patientSchema>;
export const Patient = model('Patient', patientSchema);
