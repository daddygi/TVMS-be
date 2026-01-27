import { Request, Response, NextFunction } from 'express';
import {
  importFromXlsx,
  getApprehensions,
  getApprehensionById,
} from '../services/apprehension.service';
import { AppError } from '../middlewares/errorHandler';

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
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getApprehensions();
    res.json({ data });
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
