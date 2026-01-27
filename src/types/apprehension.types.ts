import { Document } from 'mongoose';

export interface IDriver {
  lastName: string | null;
  firstName: string | null;
}

export interface IConfiscatedItem {
  type: string | null;
  number: string | null;
}

export interface IApprehension {
  dateOfSubmission: Date | null;
  daysInterval: number | null;
  dateOfApprehension: Date | null;
  timeOfApprehension: string | null;
  agency: string | null;
  apprehendingOfficer: string | null;
  caseNumber: string | null;
  driver: IDriver;
  violation: string | null;
  confiscatedItem: IConfiscatedItem;
  restrictionCode: string | null;
  conditions: string | null;
  nationality: string | null;
  gender: string | null;
  mvType: string | null;
  plateNumber: string | null;
  placeOfApprehension: string | null;
  remarks: string | null;
}

export interface IApprehensionDocument extends IApprehension, Document {}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
}
