import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { env } from '../config/env';
import {
  IUserDocument,
  TokenPayload,
  AuthTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_MS,
} from '../types/auth.types';
import { AppError } from '../middlewares/errorHandler';

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId } as TokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const register = async (username: string, password: string): Promise<IUserDocument> => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new AppError(409, 'Username already exists');
  }

  const user = await User.create({ username, password });
  return user;
};

export const login = async (username: string, password: string): Promise<AuthTokens> => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken();

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id.toString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  return { accessToken, refreshToken };
};

export const refresh = async (refreshToken: string): Promise<AuthTokens> => {
  const storedToken = await RefreshToken.findOne({ token: refreshToken });

  if (!storedToken) {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new AppError(401, 'Refresh token expired');
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });

  const accessToken = generateAccessToken(storedToken.userId);
  const newRefreshToken = generateRefreshToken();

  await RefreshToken.create({
    token: newRefreshToken,
    userId: storedToken.userId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken: string): Promise<void> => {
  await RefreshToken.deleteOne({ token: refreshToken });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired access token');
  }
};
