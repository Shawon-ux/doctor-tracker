import { Schema, model, type InferSchemaType } from 'mongoose';
import { SPECIALIZATIONS } from './constants.js';
import { toKeywords } from '../lib/search.js';

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    specialization: { type: String, required: true, enum: SPECIALIZATIONS },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    keywords: { type: [String], select: false },
  },
  { timestamps: true },
);

doctorSchema.pre('save', function () {
  this.keywords = toKeywords(this.name, this.hospital, this.specialization, this.email.split('@')[0]);
});

doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ keywords: 1 });
doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });

export type DoctorDoc = InferSchemaType<typeof doctorSchema>;
export const Doctor = model('Doctor', doctorSchema);
