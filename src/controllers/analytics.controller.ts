import { Request, Response, NextFunction } from 'express';
import { getTrends, getDistributions, getTimePatterns, getSummary } from '../services/analytics.service';
import { AppError } from '../middlewares/errorHandler';
import {
  Granularity,
  GroupBy,
  TrendsFilters,
  DistributionsFilters,
  AnalyticsFilters,
  SummaryFilters,
} from '../types/analytics.types';

const VALID_GRANULARITIES: Granularity[] = ['day', 'week', 'month'];
const VALID_GROUP_BY: GroupBy[] = ['agency', 'violation', 'location', 'mvType', 'gender'];

const parseDate = (value: unknown): Date | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

const parseBaseFilters = (query: Request['query']): AnalyticsFilters => {
  const { dateFrom, dateTo, agency, violation, placeOfApprehension } = query;

  return {
    dateFrom: parseDate(dateFrom),
    dateTo: parseDate(dateTo),
    agency: agency as string,
    violation: violation as string,
    placeOfApprehension: placeOfApprehension as string,
  };
};

export const getTrendsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { granularity } = req.query;
    const gran = (granularity as Granularity) || 'day';

    if (!VALID_GRANULARITIES.includes(gran)) {
      throw new AppError(400, `Invalid granularity. Must be one of: ${VALID_GRANULARITIES.join(', ')}`);
    }

    const filters: TrendsFilters = {
      ...parseBaseFilters(req.query),
      granularity: gran,
    };

    const data = await getTrends(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const parseLimit = (value: unknown): number | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) || num < 1 ? undefined : num;
};

export const getDistributionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupBy, limit } = req.query;
    const group = (groupBy as GroupBy) || 'agency';

    if (!VALID_GROUP_BY.includes(group)) {
      throw new AppError(400, `Invalid groupBy. Must be one of: ${VALID_GROUP_BY.join(', ')}`);
    }

    const filters: DistributionsFilters = {
      ...parseBaseFilters(req.query),
      groupBy: group,
      limit: parseLimit(limit),
    };

    const data = await getDistributions(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getTimePatternsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = parseBaseFilters(req.query);
    const data = await getTimePatterns(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dateFrom, dateTo, agency, violation, placeOfApprehension, comparePrevious } = req.query;

    const filters: SummaryFilters = {
      dateFrom: parseDate(dateFrom),
      dateTo: parseDate(dateTo),
      agency: agency as string,
      violation: violation as string,
      placeOfApprehension: placeOfApprehension as string,
      comparePrevious: comparePrevious === 'true',
    };

    const data = await getSummary(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
