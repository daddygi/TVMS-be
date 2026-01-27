import { Request, Response, NextFunction } from 'express';
import { register, login, refresh, logout } from '../services/auth.service';
import { AppError } from '../middlewares/errorHandler';
import { REFRESH_TOKEN_EXPIRY_MS } from '../types/auth.types';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'Username and password are required');
    }

    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters');
    }

    const user = await register(username, password);

    res.status(201).json({
      message: 'User registered successfully',
      data: { id: user._id, username: user.username },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'Username and password are required');
    }

    const tokens = await login(username, password);

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      message: 'Login successful',
      data: { accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!token) {
      throw new AppError(401, 'Refresh token required');
    }

    const tokens = await refresh(token);

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      message: 'Token refreshed',
      data: { accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];

    if (token) {
      await logout(token);
    }

    clearRefreshTokenCookie(res);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
