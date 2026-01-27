import * as XLSX from 'xlsx';
import { Apprehension } from '../models/apprehension.model';
import { IApprehension, IApprehensionDocument, ImportResult } from '../types/apprehension.types';
import { excelDateToJSDate, excelTimeToString } from '../utils/excel.utils';
import { cacheDeletePattern } from './cache.service';
import { CACHE_KEYS } from '../types/cache.types';

type ExcelRow = (string | number | null)[];

const parseRow = (row: ExcelRow): Partial<IApprehension> | null => {
  if (!row || row.length < 10 || !row[7]) return null;

  return {
    dateOfSubmission: excelDateToJSDate(row[1] as number),
    daysInterval: typeof row[2] === 'number' ? row[2] : null,
    dateOfApprehension: excelDateToJSDate(row[3] as number),
    timeOfApprehension: excelTimeToString(row[4] as number),
    agency: row[5]?.toString().trim() || null,
    apprehendingOfficer: row[6]?.toString().trim() || null,
    caseNumber: row[7]?.toString().trim() || null,
    driver: {
      lastName: row[8]?.toString().trim() || null,
      firstName: row[9]?.toString().trim() || null,
    },
    violation: row[10]?.toString().trim() || null,
    confiscatedItem: {
      type: row[11]?.toString().trim() || null,
      number: row[12]?.toString().trim() || null,
    },
    restrictionCode: row[13]?.toString().trim() || null,
    conditions: row[14]?.toString().trim() || null,
    nationality: row[15]?.toString().trim() || null,
    gender: row[16]?.toString().trim() || null,
    mvType: row[17]?.toString().trim() || null,
    plateNumber: row[18]?.toString().trim() || null,
    placeOfApprehension: row[19]?.toString().trim() || null,
    remarks: row[20]?.toString().trim() || null,
  };
};

export const importFromXlsx = async (buffer: Buffer): Promise<ImportResult> => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const records: Partial<IApprehension>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { header: 1 });

    for (let i = 1; i < rows.length; i++) {
      const parsed = parseRow(rows[i]);
      if (parsed) {
        records.push(parsed);
      }
    }
  }

  if (records.length === 0) {
    return { total: 0, imported: 0, skipped: 0 };
  }

  const result = await Apprehension.insertMany(records, { ordered: false });

  await invalidateListCache();

  return {
    total: records.length,
    imported: result.length,
    skipped: records.length - result.length,
  };
};

export const getApprehensions = async (): Promise<IApprehensionDocument[]> => {
  return Apprehension.find().sort({ createdAt: -1 });
};

export const getApprehensionById = async (id: string): Promise<IApprehensionDocument | null> => {
  return Apprehension.findById(id);
};

const invalidateListCache = async (): Promise<void> => {
  await cacheDeletePattern(`${CACHE_KEYS.APPREHENSION_LIST}:*`);
};

const invalidateDetailCache = async (id: string): Promise<void> => {
  await cacheDeletePattern(`${CACHE_KEYS.APPREHENSION_DETAIL}:*${id}*`);
};
