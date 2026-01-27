import mongoose, { Schema } from 'mongoose';
import { IRefreshTokenDocument } from '../types/auth.types';

const refreshTokenSchema = new Schema<IRefreshTokenDocument>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
