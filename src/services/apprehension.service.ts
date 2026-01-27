import * as XLSX from 'xlsx';
import { Apprehension } from '../models/apprehension.model';
import { IApprehension, IApprehensionDocument, ImportResult, ApprehensionFilters, StatsFilters, StatsResponse } from '../types/apprehension.types';
import { PaginationParams, PaginatedResponse } from '../types/pagination.types';
import { ApprehensionFilterQuery } from '../types/mongo.types';
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

const buildFilterQuery = (filters: ApprehensionFilters): ApprehensionFilterQuery => {
  const query: ApprehensionFilterQuery = {};

  if (filters.dateFrom || filters.dateTo) {
    query.dateOfApprehension = {
      ...(filters.dateFrom && { $gte: filters.dateFrom }),
      ...(filters.dateTo && { $lte: filters.dateTo }),
    };
  }

  if (filters.agency) {
    query.agency = { $regex: filters.agency, $options: 'i' };
  }

  if (filters.violation) {
    query.violation = { $regex: filters.violation, $options: 'i' };
  }

  if (filters.mvType) {
    query.mvType = { $regex: filters.mvType, $options: 'i' };
  }

  if (filters.plateNumber) {
    query.plateNumber = { $regex: filters.plateNumber, $options: 'i' };
  }

  if (filters.driverName) {
    query.$or = [
      { 'driver.lastName': { $regex: filters.driverName, $options: 'i' } },
      { 'driver.firstName': { $regex: filters.driverName, $options: 'i' } },
    ];
  }

  return query;
};

export const getApprehensions = async (
  filters: ApprehensionFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<IApprehensionDocument>> => {
  const query = buildFilterQuery(filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [data, total] = await Promise.all([
    Apprehension.find(query)
      .sort({ dateOfApprehension: -1 })
      .skip(skip)
      .limit(pagination.limit),
    Apprehension.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

export const getApprehensionById = async (id: string): Promise<IApprehensionDocument | null> => {
  return Apprehension.findById(id);
};

const invalidateListCache = async (): Promise<void> => {
  await cacheDeletePattern(`${CACHE_KEYS.APPREHENSION_LIST}:*`);
  await cacheDeletePattern(`${CACHE_KEYS.APPREHENSION_STATS}:*`);
};

const invalidateDetailCache = async (id: string): Promise<void> => {
  await cacheDeletePattern(`${CACHE_KEYS.APPREHENSION_DETAIL}:*${id}*`);
};

const buildStatsMatchStage = (filters: StatsFilters): Record<string, unknown> => {
  const match: Record<string, unknown> = {};

  if (filters.month) {
    const [year, monthNum] = filters.month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    match.dateOfApprehension = { $gte: startDate, $lte: endDate };
  } else if (filters.dateFrom || filters.dateTo) {
    match.dateOfApprehension = {
      ...(filters.dateFrom && { $gte: filters.dateFrom }),
      ...(filters.dateTo && { $lte: filters.dateTo }),
    };
  }

  if (filters.agency) {
    match.agency = { $regex: filters.agency, $options: 'i' };
  }
  if (filters.violation) {
    match.violation = { $regex: filters.violation, $options: 'i' };
  }
  if (filters.placeOfApprehension) {
    match.placeOfApprehension = { $regex: filters.placeOfApprehension, $options: 'i' };
  }

  return match;
};

interface FacetResult {
  total: { count: number }[];
  agencies: { _id: string | null; count: number }[];
  violations: { _id: string | null; count: number }[];
  locations: { _id: string | null; count: number }[];
}

export const getStats = async (filters: StatsFilters): Promise<StatsResponse> => {
  const matchStage = buildStatsMatchStage(filters);
  const topLimit = Math.min(filters.topLimit || 5, 10);

  const [result] = await Apprehension.aggregate<FacetResult>([
    { $match: matchStage },
    {
      $facet: {
        total: [{ $count: 'count' }],
        agencies: [
          { $group: { _id: '$agency', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: topLimit },
        ],
        violations: [
          { $group: { _id: '$violation', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: topLimit },
        ],
        locations: [
          { $group: { _id: '$placeOfApprehension', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: topLimit },
        ],
      },
    },
  ]);

  return {
    total: result.total[0]?.count || 0,
    topAgencies: result.agencies.map(a => ({ agency: a._id || 'Unknown', count: a.count })),
    topViolations: result.violations.map(v => ({ violation: v._id || 'Unknown', count: v.count })),
    topLocations: result.locations.map(l => ({ location: l._id || 'Unknown', count: l.count })),
  };
};
