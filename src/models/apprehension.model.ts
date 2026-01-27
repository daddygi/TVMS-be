import mongoose, { Schema } from 'mongoose';
import { IApprehensionDocument } from '../types/apprehension.types';

const apprehensionSchema = new Schema<IApprehensionDocument>(
  {
    dateOfSubmission: { type: Date, default: null },
    daysInterval: { type: Number, default: null },
    dateOfApprehension: { type: Date, default: null },
    timeOfApprehension: { type: String, default: null },
    agency: { type: String, default: null },
    apprehendingOfficer: { type: String, default: null },
    caseNumber: { type: String, default: null },
    driver: {
      lastName: { type: String, default: null },
      firstName: { type: String, default: null },
    },
    violation: { type: String, default: null },
    confiscatedItem: {
      type: { type: String, default: null },
      number: { type: String, default: null },
    },
    restrictionCode: { type: String, default: null },
    conditions: { type: String, default: null },
    nationality: { type: String, default: null },
    gender: { type: String, default: null },
    mvType: { type: String, default: null },
    plateNumber: { type: String, default: null },
    placeOfApprehension: { type: String, default: null },
    remarks: { type: String, default: null },
  },
  { timestamps: true }
);

export const Apprehension = mongoose.model<IApprehensionDocument>('Apprehension', apprehensionSchema);
