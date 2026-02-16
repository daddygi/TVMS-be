import { Apprehension } from '../models/apprehension.model';
import {
  AnalyticsFilters,
  TrendsFilters,
  TrendsResponse,
  DistributionsFilters,
  DistributionsResponse,
  TimePatternsResponse,
  SummaryFilters,
  SummaryResponse,
  GroupBy,
} from '../types/analytics.types';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildMatchStage = (filters: AnalyticsFilters): Record<string, unknown> => {
  const match: Record<string, unknown> = {};

  if (filters.dateFrom || filters.dateTo) {
    match.dateOfApprehension = {
      ...(filters.dateFrom && { $gte: filters.dateFrom }),
      ...(filters.dateTo && { $lte: filters.dateTo }),
    };
  }

  if (filters.agency) {
    match.agency = { $regex: escapeRegex(filters.agency), $options: 'i' };
  }
  if (filters.violation) {
    match.violation = { $regex: escapeRegex(filters.violation), $options: 'i' };
  }
  if (filters.placeOfApprehension) {
    match.placeOfApprehension = { $regex: escapeRegex(filters.placeOfApprehension), $options: 'i' };
  }

  return match;
};

const getDateFormat = (granularity: TrendsFilters['granularity']): string => {
  switch (granularity) {
    case 'day':
      return '%Y-%m-%d';
    case 'week':
      return '%Y-W%V';
    case 'month':
      return '%Y-%m';
  }
};

export const getTrends = async (filters: TrendsFilters): Promise<TrendsResponse> => {
  const matchStage = buildMatchStage(filters);
  const dateFormat = getDateFormat(filters.granularity);

  const result = await Apprehension.aggregate<{ _id: string; count: number }>([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$dateOfApprehension' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    granularity: filters.granularity,
    series: result.map((r) => ({ date: r._id, count: r.count })),
  };
};

const getGroupByField = (groupBy: GroupBy): string => {
  switch (groupBy) {
    case 'agency':
      return '$agency';
    case 'violation':
      return '$violation';
    case 'location':
      return '$placeOfApprehension';
    case 'mvType':
      return '$mvType';
    case 'gender':
      return '$gender';
  }
};

interface DistributionAggResult {
  items: { _id: string | null; count: number }[];
  total: { count: number }[];
}

export const getDistributions = async (filters: DistributionsFilters): Promise<DistributionsResponse> => {
  const matchStage = buildMatchStage(filters);
  const groupByField = getGroupByField(filters.groupBy);
  const limit = Math.min(filters.limit || 10, 50);

  const [result] = await Apprehension.aggregate<DistributionAggResult>([
    { $match: matchStage },
    {
      $facet: {
        items: [
          { $group: { _id: groupByField, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return {
    groupBy: filters.groupBy,
    items: result.items.map((i) => ({ label: i._id || 'Unknown', count: i.count })),
    total: result.total[0]?.count || 0,
  };
};

interface TimePatternsAggResult {
  byHour: { _id: number; count: number }[];
  byDayOfWeek: { _id: number; count: number }[];
}

export const getTimePatterns = async (filters: AnalyticsFilters): Promise<TimePatternsResponse> => {
  const matchStage = buildMatchStage(filters);

  const [result] = await Apprehension.aggregate<TimePatternsAggResult>([
    { $match: { ...matchStage, dateOfApprehension: { ...matchStage.dateOfApprehension as object, $ne: null } } },
    {
      $facet: {
        byHour: [
          { $match: { timeOfApprehension: { $ne: null, $regex: /^\d{1,2}:/ } } },
          {
            $group: {
              _id: { $toInt: { $arrayElemAt: [{ $split: ['$timeOfApprehension', ':'] }, 0] } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        byDayOfWeek: [
          {
            $group: {
              _id: { $dayOfWeek: '$dateOfApprehension' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  // Fill in missing hours (0-23)
  const hourMap = new Map(result.byHour.map((h) => [h._id, h.count]));
  const byHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourMap.get(i) || 0,
  }));

  // Fill in missing days (1-7, MongoDB dayOfWeek: 1=Sunday, 7=Saturday)
  const dayMap = new Map(result.byDayOfWeek.map((d) => [d._id, d.count]));
  const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    label: DAY_LABELS[i],
    count: dayMap.get(i + 1) || 0, // MongoDB uses 1-7, we use 0-6
  }));

  return { byHour, byDayOfWeek };
};

const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

interface SummaryAggResult {
  currentCount: { count: number }[];
  previousCount: { count: number }[];
}

export const getSummary = async (filters: SummaryFilters): Promise<SummaryResponse> => {
  const now = new Date();
  const currentFrom = filters.dateFrom || new Date(now.getFullYear(), now.getMonth(), 1);
  const currentTo = filters.dateTo || now;

  // Calculate previous period dates
  const durationMs = currentTo.getTime() - currentFrom.getTime();
  const previousTo = new Date(currentFrom.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  // Build base filter for non-date fields
  const baseMatch: Record<string, unknown> = {};
  if (filters.agency) {
    baseMatch.agency = { $regex: escapeRegex(filters.agency), $options: 'i' };
  }
  if (filters.violation) {
    baseMatch.violation = { $regex: escapeRegex(filters.violation), $options: 'i' };
  }
  if (filters.placeOfApprehension) {
    baseMatch.placeOfApprehension = { $regex: escapeRegex(filters.placeOfApprehension), $options: 'i' };
  }

  // Single aggregation for both periods
  const [result] = await Apprehension.aggregate<SummaryAggResult>([
    {
      $facet: {
        currentCount: [
          { $match: { ...baseMatch, dateOfApprehension: { $gte: currentFrom, $lte: currentTo } } },
          { $count: 'count' },
        ],
        previousCount: filters.comparePrevious
          ? [
              { $match: { ...baseMatch, dateOfApprehension: { $gte: previousFrom, $lte: previousTo } } },
              { $count: 'count' },
            ]
          : [{ $limit: 0 }],
      },
    },
  ]);

  const currentCount = result.currentCount[0]?.count || 0;
  const response: SummaryResponse = {
    current: {
      total: currentCount,
      period: {
        from: formatDateString(currentFrom),
        to: formatDateString(currentTo),
      },
    },
  };

  if (filters.comparePrevious) {
    const previousCount = result.previousCount[0]?.count || 0;

    response.previous = {
      total: previousCount,
      period: {
        from: formatDateString(previousFrom),
        to: formatDateString(previousTo),
      },
    };

    const absolute = currentCount - previousCount;
    const percentage = previousCount > 0 ? (absolute / previousCount) * 100 : 0;

    response.growth = {
      absolute,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  return response;
};
