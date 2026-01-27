import { Document } from 'mongoose';

export interface IUser {
  username: string;
  password: string;
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

export interface TokenPayload {
  userId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const ACCESS_TOKEN_EXPIRY = '1h';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
