import { Request, Response, NextFunction } from 'express';
import {
  importFromXlsx,
  getApprehensions,
  getApprehensionById,
} from '../services/apprehension.service';
import { AppError } from '../middlewares/errorHandler';
import { ApprehensionFilters } from '../types/apprehension.types';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../types/pagination.types';

export const importApprehensions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const result = await importFromXlsx(req.file.buffer);

    res.status(200).json({
      message: 'Import completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listApprehensions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dateFrom, dateTo, agency, violation, mvType, plateNumber, driverName } = req.query;

    const filters: ApprehensionFilters = {
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      agency: agency as string,
      violation: violation as string,
      mvType: mvType as string,
      plateNumber: plateNumber as string,
      driverName: driverName as string,
    };

    const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));

    const result = await getApprehensions(filters, { page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getApprehension = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await getApprehensionById(id);

    if (!data) {
      throw new AppError(404, 'Apprehension not found');
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
};
