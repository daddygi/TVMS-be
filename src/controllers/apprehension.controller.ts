import { Request, Response, NextFunction } from 'express';
import { importFromXlsx } from '../services/apprehension.service';
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
